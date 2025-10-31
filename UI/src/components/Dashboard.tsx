import { useEffect, useState } from "react";
import { Edit, Trash2, FileAudio, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import EditModal from "./EditModal";
import DeleteDialog from "./DeleteDialog";

export interface FileRecord {
  id: string;
  englishAudio: string;
  japaneseAudio: string;
  reportMd: string;
  reportPdf?: string;
  uploadDate: string;
}

const mockData: FileRecord[] = [
  {
    id: "1",
    englishAudio: "english_meeting_01.mp3",
    japaneseAudio: "japanese_meeting_01.mp3",
    reportMd: "meeting_notes_01.md",
    reportPdf: "meeting_notes_01.pdf",
    uploadDate: "2025-01-15",
  },
  {
    id: "2",
    englishAudio: "english_interview_02.wav",
    japaneseAudio: "japanese_interview_02.wav",
    reportMd: "interview_summary_02.md",
    uploadDate: "2025-01-14",
  },
  {
    id: "3",
    englishAudio: "english_presentation_03.m4a",
    japaneseAudio: "japanese_presentation_03.m4a",
    reportMd: "presentation_report_03.md",
    reportPdf: "presentation_report_03.pdf",
    uploadDate: "2025-01-13",
  },
];

const Dashboard = () => {
  const [records, setRecords] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<FileRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState<boolean>(false);

  const handleEdit = (record: FileRecord) => {
    setEditingRecord(record);
  };

  const handleSaveEdit = (updatedRecord: FileRecord) => {
    setRecords(records.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setEditingRecord(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingInProgress(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/records/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
      throw e;
    } finally {
      setDeletingInProgress(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/records`);
      if (!res.ok) throw new Error("Failed to fetch records");
      const data = await res.json();
      // Map Firestore structure to FileRecord UI shape
      const mapped = data.map((d: any) => ({
        id: d.id,
        englishAudio: d.english?.filename || "",
        japaneseAudio: d.japanese?.filename || "",
        reportMd: d.report_md?.filename || "",
        reportPdf: d.report_pdf?.filename || undefined,
        uploadDate: d.created_at || new Date().toISOString(),
      }));
      setRecords(mapped);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  return (
    <section className="container mx-auto px-4 py-16 bg-gradient-subtle" id="dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">Records Dashboard</h2>
          <p className="text-muted-foreground">
            View, edit, and manage all your uploaded files
          </p>
        </div>

        <Card className="shadow-elevated animate-scale-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                  {records.length} record{records.length !== 1 ? 's' : ''} in total
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className="text-sm text-muted-foreground">Loading...</span>
                ) : (
                  <Button size="sm" onClick={() => fetchRecords()}>Refresh</Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>ID</TableHead>
                    <TableHead>English Audio</TableHead>
                    <TableHead>Japanese Audio</TableHead>
                    <TableHead>MD Report</TableHead>
                    <TableHead>PDF Report</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow 
                      key={record.id} 
                      className="hover:bg-muted/50 transition-colors animate-slide-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <TableCell className="font-medium">#{record.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate max-w-[150px]" title={record.englishAudio}>
                            {record.englishAudio}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate max-w-[150px]" title={record.japaneseAudio}>
                            {record.japaneseAudio}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-accent" />
                          <span className="text-sm truncate max-w-[150px]" title={record.reportMd}>
                            {record.reportMd}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.reportPdf ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-accent" />
                            <span className="text-sm truncate max-w-[150px]" title={record.reportPdf}>
                              {record.reportPdf}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(record.uploadDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                            className="hover:bg-primary hover:text-primary-foreground transition-colors"
                            disabled={deletingInProgress}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingId(record.id)}
                            className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            disabled={deletingInProgress}
                          >
                            {deletingInProgress && deletingId === record.id ? (
                              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {editingRecord && (
        <EditModal
          record={editingRecord}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRecord(null)}
        />
      )}

      {deletingId && (
        <DeleteDialog
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </section>
  );
};

export default Dashboard;
