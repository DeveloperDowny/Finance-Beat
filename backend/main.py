import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import firebase_admin
from firebase_admin import credentials, firestore, storage
from fastapi import Request
from fastapi.responses import JSONResponse, RedirectResponse, StreamingResponse
from datetime import datetime, timedelta
import io

LOCAL_RUN = os.getenv("LOCAL_RUN", "false").lower() == "true"

if LOCAL_RUN:
    # -------------------------------------------
    # ✅ Initialize Firebase (Firestore + Storage)
    # -------------------------------------------

    # Path to service account key
    SERVICE_ACCOUNT_FILE = "serviceAccountKey.json"
    STORAGE_BUCKET = "financepodcast-a5c7f.firebasestorage.app"

    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        raise FileNotFoundError("❌ serviceAccountKey.json not found. Place it in the same folder as main.py")

    # Initialize Firebase Admin SDK
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)

    if not firebase_admin._apps:
        # ✅ Use your actual Firebase bucket name (as seen in the Firebase console)
        firebase_admin.initialize_app(cred, {
            "storageBucket": STORAGE_BUCKET
        })
    db = firestore.client()
    bucket = storage.bucket()
else:
    # --- GCP Environment
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    
    STORAGE_BUCKET = "finance-beat"
    db = firestore.client()
    bucket = storage.bucket(STORAGE_BUCKET)



# -------------------------------------------
# ✅ FastAPI App Setup
# -------------------------------------------
app = FastAPI(title="Firebase Upload API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------
# ✅ Pydantic Model
# -------------------------------------------
class FileInfo(BaseModel):
    filename: str
    storage_path: str
    content_type: Optional[str] = None
    public_url: Optional[str] = None


class RecordAllFiles(BaseModel):
    id: str
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = "Finance Report"
    speakers: Optional[list] = None
    english: FileInfo
    japanese: FileInfo
    report_md: FileInfo
    report_pdf: Optional[FileInfo] = None


# -------------------------------------------
# ✅ Upload a new file
# -------------------------------------------
@app.post("/records", response_model=RecordAllFiles)
async def create_record(
    english_audio: UploadFile = File(...),
    japanese_audio: UploadFile = File(...),
    report_md: UploadFile = File(...),
    report_pdf: Optional[UploadFile] = File(None),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    theme: Optional[str] = Form("Finance Report"),
    speakers: Optional[str] = Form(None),  # JSON string: [{"title":"Host","description":"..."}, ...]
):
    """Upload all files under a single record ID and store nested metadata in Firestore."""
    try:
        record_id = str(uuid.uuid4())

        async def _upload_file(file_obj: UploadFile):
            if not file_obj:
                return None
            blob_path = f"records/{record_id}/{file_obj.filename}"
            blob = bucket.blob(blob_path)
            contents = None
            # Prefer the async read() provided by Starlette's UploadFile
            try:
                contents = await file_obj.read()
            except Exception:
                # fallback to synchronous file read (e.g., when running in some test environments)
                try:
                    if hasattr(file_obj, "file") and hasattr(file_obj.file, "read"):
                        contents = file_obj.file.read()
                except Exception:
                    contents = None

            if contents is None:
                # Nothing to upload
                return None

            blob.upload_from_string(contents, content_type=file_obj.content_type)
            try:
                blob.make_public()
            except Exception:
                pass
            return {
                "filename": file_obj.filename,
                "storage_path": blob_path,
                "content_type": file_obj.content_type,
                "public_url": blob.public_url,
            }

        # Upload each provided file (await async helper so contents are read correctly)
        english_info = await _upload_file(english_audio)
        japanese_info = await _upload_file(japanese_audio)
        report_md_info = await _upload_file(report_md)
        report_pdf_info = await _upload_file(report_pdf) if report_pdf is not None else None

        # parse speakers JSON if provided
        parsed_speakers = None
        if speakers:
            try:
                import json

                parsed_speakers = json.loads(speakers)
            except Exception:
                parsed_speakers = None

        record_data = {
            "id": record_id,
            "title": title,
            "description": description,
            "theme": theme,
            "speakers": parsed_speakers,
            "english": english_info,
            "japanese": japanese_info,
            "report_md": report_md_info,
            "report_pdf": report_pdf_info,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }

        db.collection("records").document(record_id).set(record_data)
        return record_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------
# ✅ Get all records
# -------------------------------------------
@app.get("/records", response_model=List[RecordAllFiles])
def list_records():
    try:
        docs = db.collection("records").stream()
        records = [doc.to_dict() for doc in docs]
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------
# ✅ Get a single record by ID
# -------------------------------------------
@app.get("/records/{record_id}", response_model=RecordAllFiles)
def get_record(record_id: str):
    doc = db.collection("records").document(record_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Record not found")
    return doc.to_dict()


# -------------------------------------------
# ✅ Update record (optional file)
# -------------------------------------------
@app.put("/records/{record_id}", response_model=RecordAllFiles)
async def update_record(
    record_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    theme: Optional[str] = Form(None),
    speakers: Optional[str] = Form(None),
    english_audio: Optional[UploadFile] = File(None),
    japanese_audio: Optional[UploadFile] = File(None),
    report_md: Optional[UploadFile] = File(None),
    report_pdf: Optional[UploadFile] = File(None),
):
    doc_ref = db.collection("records").document(record_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Record not found")
    updated_data = {}
    if title is not None:
        updated_data["title"] = title
    if description is not None:
        updated_data["description"] = description
    if theme is not None:
        updated_data["theme"] = theme

    # parse speakers if provided
    if speakers is not None:
        try:
            import json

            parsed = json.loads(speakers)
            updated_data["speakers"] = parsed
        except Exception:
            # ignore parse errors and skip updating speakers
            pass

    async def _upload_and_build(file_obj: UploadFile):
        if not file_obj:
            return None
        blob_path = f"records/{record_id}/{file_obj.filename}"
        blob = bucket.blob(blob_path)
        contents = None
        try:
            contents = await file_obj.read()
        except Exception:
            try:
                if hasattr(file_obj, "file") and hasattr(file_obj.file, "read"):
                    contents = file_obj.file.read()
            except Exception:
                contents = None

        if contents is None:
            return None

        blob.upload_from_string(contents, content_type=file_obj.content_type)
        try:
            blob.make_public()
        except Exception:
            pass
        return {
            "filename": file_obj.filename,
            "storage_path": blob_path,
            "content_type": file_obj.content_type,
            "public_url": blob.public_url,
        }

    if english_audio is not None:
        updated_data["english"] = await _upload_and_build(english_audio)
    if japanese_audio is not None:
        updated_data["japanese"] = await _upload_and_build(japanese_audio)
    if report_md is not None:
        updated_data["report_md"] = await _upload_and_build(report_md)
    if report_pdf is not None:
        updated_data["report_pdf"] = await _upload_and_build(report_pdf)

    if updated_data:
        doc_ref.update(updated_data)

    updated_doc = doc_ref.get()
    return updated_doc.to_dict()


# -------------------------------------------
# ✅ Delete record (Firestore + Storage)
# -------------------------------------------
@app.delete("/records/{record_id}")
def delete_record(record_id: str):
    doc_ref = db.collection("records").document(record_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Record not found")
    data = doc.to_dict() or {}
    # delete nested files if they exist
    for key in ("english", "japanese", "report_md", "report_pdf"):
        info = data.get(key)
        if info and isinstance(info, dict) and info.get("storage_path"):
            try:
                bucket.blob(info["storage_path"]).delete()
            except Exception:
                pass

    doc_ref.delete()
    return {"status": "deleted"}


# -------------------------------------------
# ✅ Health Check
# -------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


# -------------------------------------------
# ✅ Serve / redirect to a file URL (public or signed)
# -------------------------------------------
@app.get("/records/{record_id}/download/{key}")
def download_file(record_id: str, key: str):
    """Redirect to the file's public URL if available, otherwise generate a signed URL.

    key must be one of: english, japanese, report_md, report_pdf
    """
    allowed = ("english", "japanese", "report_md", "report_pdf")
    if key not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file key")

    doc = db.collection("records").document(record_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Record not found")

    data = doc.to_dict() or {}
    info = data.get(key)
    if not info or not isinstance(info, dict):
        raise HTTPException(status_code=404, detail="File not found for key")

    public_url = info.get("public_url")
    storage_path = info.get("storage_path")

    if public_url:
        return RedirectResponse(public_url)

    if storage_path:
        blob = bucket.blob(storage_path)
        try:
            signed_url = blob.generate_signed_url(expiration=timedelta(minutes=15))
            return RedirectResponse(signed_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {e}")

    raise HTTPException(status_code=404, detail="No URL available for file")


# -------------------------------------------
# ✅ Stream/proxy file bytes from Storage (avoids redirect/CORS issues)
# -------------------------------------------
@app.get("/records/{record_id}/stream/{key}")
def stream_file(record_id: str, key: str, request: Request):
    """
    Stream WAV/MP3 (or other files) from Firebase Storage with proper headers
    and support for Range requests (essential for audio playback).
    
    key: english | japanese | report_md | report_pdf
    """
    allowed_keys = ("english", "japanese", "report_md", "report_pdf")
    if key not in allowed_keys:
        raise HTTPException(status_code=400, detail="Invalid file key")

    doc = db.collection("records").document(record_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Record not found")

    data = doc.to_dict() or {}
    file_info = data.get(key)
    if not file_info or not isinstance(file_info, dict):
        raise HTTPException(status_code=404, detail="File not found")

    storage_path = file_info.get("storage_path")
    if not storage_path:
        raise HTTPException(status_code=404, detail="No storage path for file")

    filename = file_info.get("filename") or "file"
    content_type = file_info.get("content_type") or "application/octet-stream"
    if filename.lower().endswith(".wav"):
        content_type = "audio/wav"
    elif filename.lower().endswith(".mp3"):
        content_type = "audio/mpeg"

    blob = bucket.blob(storage_path)
    try:
        blob.reload()
        total_size = int(blob.size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load file: {e}")

    # Check for Range header
    range_header = request.headers.get("range")
    if range_header:
        try:
            # Example: Range: bytes=0-1023
            units, range_spec = range_header.strip().split("=")
            start_str, end_str = range_spec.split("-")
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else total_size - 1
            if end >= total_size:
                end = total_size - 1
            if start > end:
                start, end = 0, total_size - 1
        except Exception:
            start, end = 0, total_size - 1

        data_bytes = blob.download_as_bytes(start=start, end=end)
        headers = {
            "Content-Disposition": f'inline; filename="{filename}"',
            "Content-Type": content_type,
            "Content-Range": f"bytes {start}-{end}/{total_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(len(data_bytes)),
        }
        return StreamingResponse(io.BytesIO(data_bytes), status_code=206, headers=headers)

    # Full content if no Range
    data_bytes = blob.download_as_bytes()
    headers = {
        "Content-Disposition": f'inline; filename="{filename}"',
        "Content-Type": content_type,
        "Accept-Ranges": "bytes",
        "Content-Length": str(len(data_bytes)),
    }
    return StreamingResponse(io.BytesIO(data_bytes), headers=headers)

# -------------------------------------------
# ✅ Run Locally
# -------------------------------------------
if __name__ == "__main__":
    
    import uvicorn
    
    if LOCAL_RUN:
        host =  "127.0.0.1"
    else:
        host = "0.0.0.0"
    port = os.getenv("PORT", "8080")
    uvicorn.run(app, host=host, port=port)
