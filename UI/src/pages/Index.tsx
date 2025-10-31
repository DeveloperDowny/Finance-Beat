import { useEffect, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import RecordCard from "@/components/RecordCard";
import { Input } from "@/components/ui/input";
import podcastHero from "@/assets/podcast-hero.jpg";

interface BackendRecord {
  id: string;
  title?: string;
  description?: string;
  theme?: string;
  english?: { public_url?: string };
  japanese?: { public_url?: string };
  report_md?: { public_url?: string; filename?: string };
  report_pdf?: { public_url?: string; filename?: string } | null;
  created_at?: string;
}

const Index = () => {
  const [records, setRecords] = useState<BackendRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/records`);
      if (!res.ok) throw new Error("Failed to fetch records");
      const data = await res.json();
      setRecords(data);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const filteredRecords = records.filter((r) => (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()));

  // Group records by theme
  const recordsByTheme = filteredRecords.reduce((acc: Record<string, BackendRecord[]>, record) => {
    const theme = record.theme || "Others";
    if (!acc[theme]) acc[theme] = [];
    acc[theme].push(record);
    return acc;
  }, {});


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={podcastHero} 
            alt="Finance Podcast Platform" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-accent/90" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-primary-foreground">
                Premium Financial Content
              </span>
            </div>
            
            <h3 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              NomuBeat (ノムビート): 金融インサイトポッドキャスト
            </h3>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
              金融業界の鼓動。英語と日本語でお届けするバイリンガルの金融分析と専門家インタビュー。詳細なレポートもご利用いただけます。
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search episodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-background/95 backdrop-blur-sm border-2 border-background/50 focus:border-accent text-lg"
              />
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full">
            <path 
              fill="hsl(var(--background))" 
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Episodes Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
      {loading ? (
        <div className="text-center py-12">Loading episodes...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : Object.keys(recordsByTheme).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No episodes found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        Object.entries(recordsByTheme).map(([theme, records]) => (
          <div key={theme} className="mb-12 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[#A50034]">
              {theme}
            </h2>
            <p className="text-muted-foreground mb-6">
              {records.length} episode{records.length !== 1 ? "s" : ""} under this theme
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {records.map((record, index) => (
                <div
                  key={record.id}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <RecordCard
                    id={record.id}
                    title={record.title || "Untitled"}
                    uploadDate={record.created_at || new Date().toISOString()}
                    hasPdf={!!record.report_pdf}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
    </div>
  );
};
export default Index;
