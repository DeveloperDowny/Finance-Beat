import { useEffect, useState } from "react";
import { FileAudio, FileText, Save } from "lucide-react";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileRecord } from "./Dashboard";
import { useToast } from "@/hooks/use-toast";

interface EditModalProps {
  record: FileRecord;
  onSave: (record: FileRecord) => void;
  onCancel: () => void;
}

const EditModal = ({ record, onSave, onCancel }: EditModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // fetched full record from API
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [theme, setTheme] = useState<string>("Finance Report");
  const [currentFiles, setCurrentFiles] = useState<any>(null);
  const [speakers, setSpeakers] = useState<{ title?: string; description?: string }[]>([]);

  const [englishFile, setEnglishFile] = useState<File | null>(null);
  const [japaneseFile, setJapaneseFile] = useState<File | null>(null);
  const [reportMdFile, setReportMdFile] = useState<File | null>(null);
  const [reportPdfFile, setReportPdfFile] = useState<File | null>(null);

  useEffect(() => {
    // fetch full record
    const fetchRecord = async () => {
      try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";
        const res = await fetch(`${baseUrl}/records/${record.id}`);
        if (!res.ok) throw new Error("Failed to fetch record");
        const data = await res.json();
        setTitle(data.title || "");
        setDescription(data.description || "");
        setTheme(data.theme || "Finance Report");
        setCurrentFiles(data);
  setSpeakers(data.speakers || []);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchRecord();
  }, [record.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("theme", theme);
  if (speakers && speakers.length > 0) fd.append("speakers", JSON.stringify(speakers));
      if (englishFile) fd.append("english_audio", englishFile, englishFile.name);
      if (japaneseFile) fd.append("japanese_audio", japaneseFile, japaneseFile.name);
      if (reportMdFile) fd.append("report_md", reportMdFile, reportMdFile.name);
      if (reportPdfFile) fd.append("report_pdf", reportPdfFile, reportPdfFile.name);

      const res = await fetch(`${baseUrl}/records/${record.id}`, {
        method: "PUT",
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Update failed");
      }
      const updated = await res.json();
      // map updated to FileRecord shape
      const mapped: FileRecord = {
        id: updated.id,
        englishAudio: updated.english?.filename || record.englishAudio,
        japaneseAudio: updated.japanese?.filename || record.japaneseAudio,
        reportMd: updated.report_md?.filename || record.reportMd,
        reportPdf: updated.report_pdf?.filename || record.reportPdf,
        uploadDate: updated.created_at || new Date().toISOString(),
      };
      toast({ title: "Record updated", description: "Changes saved." });
      onSave(mapped);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Update failed", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Record #{record.id}</DialogTitle>
          <DialogDescription>
            Update the file names for this record
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileAudio className="h-4 w-4 text-primary" />
              English Audio (current: {currentFiles?.english?.filename || record.englishAudio})
            </Label>
            <Input id="edit-english-audio" type="file" accept="audio/*" onChange={(e) => setEnglishFile(e.target.files?.[0] || null)} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileAudio className="h-4 w-4 text-primary" />
              Japanese Audio (current: {currentFiles?.japanese?.filename || record.japaneseAudio})
            </Label>
            <Input id="edit-japanese-audio" type="file" accept="audio/*" onChange={(e) => setJapaneseFile(e.target.files?.[0] || null)} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              Markdown Report (current: {currentFiles?.report_md?.filename || record.reportMd})
            </Label>
            <Input id="edit-report-md" type="file" accept=".md,.markdown" onChange={(e) => setReportMdFile(e.target.files?.[0] || null)} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              PDF Report (Optional) (current: {currentFiles?.report_pdf?.filename || record.reportPdf || 'N/A'})
            </Label>
            <Input id="edit-report-pdf" type="file" accept=".pdf" onChange={(e) => setReportPdfFile(e.target.files?.[0] || null)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-theme">Theme</Label>
            <select
              id="edit-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="Finance Report">Finance Report</option>
              <option value="Finance Topic">Finance Topic</option>
              <option value="Financial Literacy">Financial Literacy</option>
              <option value="Company Info">Company Info</option>
            </select>
          </div>


          {/* Speakers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">Speakers</Label>
              <Button type="button" variant="ghost" onClick={() => setSpeakers((s) => [...s, { title: "", description: "" }])}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add Speaker
              </Button>
            </div>
            <div className="space-y-2">
              {speakers.map((sp, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-12 sm:col-span-4"
                    placeholder="Name / Role"
                    value={sp.title || ""}
                    onChange={(e) => setSpeakers((prev) => prev.map((p, i) => (i === idx ? { ...p, title: e.target.value } : p)))}
                  />
                  <Input
                    className="col-span-12 sm:col-span-7"
                    placeholder="Short description"
                    value={sp.description || ""}
                    onChange={(e) => setSpeakers((prev) => prev.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p)))}
                  />
                  <Button type="button" variant="ghost" className="col-span-12 sm:col-span-1" onClick={() => setSpeakers((prev) => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;
