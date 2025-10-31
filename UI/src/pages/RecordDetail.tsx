import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface BackendRecord {
  id: string;
  title?: string;
  description?: string;
  theme?: string;
  speakers?: { title?: string; description?: string }[];
  english?: { public_url?: string };
  japanese?: { public_url?: string };
  report_md?: { public_url?: string; filename?: string };
  report_pdf?: { public_url?: string; filename?: string } | null;
  created_at?: string;
}

const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<BackendRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/records/${id}`);
        if (!res.ok) throw new Error("Failed to fetch record");
        const data = await res.json();
        setRecord(data);
      } catch (e: any) {
        setError(e?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id, API_BASE]);

  if (loading) return <div className="min-h-screen bg-gradient-subtle"><Navbar /><div className="container mx-auto px-4 py-16 text-center">Loading...</div></div>;

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Record not found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Record #{record.id}</Badge>
              <Badge variant="secondary">{new Date(record.created_at || "").toLocaleDateString()}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{record.title}</h1>
            <p className="text-lg text-muted-foreground">{record.description}</p>
            {record.theme && (
              <div className="mt-2">
                <span className="font-medium text-gray-800">Theme:</span>{" "}
                <span className="text-[#A50034]">{record.theme}</span>
              </div>
            )}
            {record.speakers && record.speakers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Speakers</h3>
                <div className="space-y-2">
                  {record.speakers.map((s: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Audio Players */}
          <div className="grid md:grid-cols-2 gap-6">
            <AudioPlayer
              title="English Version"
              language="English"
              audioFile={record.english?.public_url || `${API_BASE}/records/${record.id}/stream/english`}
            />
            <AudioPlayer
              title="Japanese Version"
              language="Japanese"
              audioFile={record.japanese?.public_url || `${API_BASE}/records/${record.id}/stream/japanese`}
            />
          </div>

          {/* Reports Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>Download or view the associated reports for this record</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                  <FileText className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">{record.report_md?.filename || "Markdown Report"}</p>
                    <p className="text-sm text-muted-foreground">Markdown Report</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full sm:w-auto">
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl w-full sm:mx-4 max-h-[90vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>{record.report_md?.filename || "Markdown Report"}</DialogTitle>
                        <DialogDescription>Preview of the markdown report</DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <MarkdownViewer url={`${API_BASE}/records/${record.id}/stream/report_md`} />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
                    <a
                      href={record.report_md?.public_url || `${API_BASE}/records/${record.id}/stream/report_md`}
                      target="_blank"
                      rel="noreferrer"
                      download
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>

              {record.report_pdf && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <FileText className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">{record.report_pdf.filename}</p>
                      <p className="text-sm text-muted-foreground">PDF Report</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto">
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl w-full sm:mx-4 max-h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>{record.report_pdf.filename}</DialogTitle>
                          <DialogDescription>Preview of the PDF report</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <iframe
                            src={`${API_BASE}/records/${record.id}/stream/report_pdf`}
                            title={record.report_pdf.filename}
                            className="w-full h-[80vh] border"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
                      <a
                        href={record.report_pdf.public_url || `${API_BASE}/records/${record.id}/stream/report_pdf`}
                        target="_blank"
                        rel="noreferrer"
                        download
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecordDetail;

// Simple Markdown viewer (lightweight, no extra deps)
function MarkdownViewer({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch markdown");
        const text = await res.text();
        if (!mounted) return;
        setContent(text);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Unknown error");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [url]);

  if (loading) return <div className="min-h-[200px] flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-[200px] p-4 text-red-500">{error}</div>;

  return (
    <div className="prose max-w-none p-4">
      <pre className="whitespace-pre-wrap break-words text-sm">{content}</pre>
    </div>
  );
}
