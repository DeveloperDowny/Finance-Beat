import { useNavigate } from "react-router-dom";
import { FileText, Calendar, Music } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RecordCardProps {
  id: string;
  title: string;
  uploadDate: string;
  hasPdf: boolean;
  thumbnail?: string;
}

const RecordCard = ({ id, title, uploadDate, hasPdf, thumbnail }: RecordCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="overflow-hidden hover:shadow-elevated transition-all duration-300 hover:scale-105 cursor-pointer group animate-scale-in"
      onClick={() => navigate(`/record/${id}`)}
    >
      <div className="relative h-48 bg-gradient-primary overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Music className="h-16 w-16 text-primary-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-bold text-lg line-clamp-2 group-hover:text-accent transition-colors">
            {title}
          </h3>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date(uploadDate).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            <Music className="h-3 w-3 mr-1" />
            Dual Audio
          </Badge>
          {hasPdf && (
            <Badge variant="secondary" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              PDF Report
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant="outline"
        >
        詳細を見る
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecordCard;
