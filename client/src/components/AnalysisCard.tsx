import { TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface AnalysisCardProps {
  id: number;
  thumbnailUrl?: string | null;
  imageUrl: string;
  trend?: string | null;
  assetName?: string | null;
  confidence?: number | null;
  createdAt: Date;
  onDelete?: (id: number) => void;
}

export default function AnalysisCard({
  id,
  thumbnailUrl,
  imageUrl,
  trend,
  assetName,
  confidence,
  createdAt,
  onDelete,
}: AnalysisCardProps) {
  const [, setLocation] = useLocation();
  const isBearish = trend?.toLowerCase().includes("bearish") || trend?.toLowerCase().includes("baixa");

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => setLocation(`/analysis/${id}`)}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <img
            src={thumbnailUrl || imageUrl}
            alt="Chart"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {isBearish ? (
                <TrendingDown className="w-5 h-5 text-destructive flex-shrink-0" />
              ) : (
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
              )}
              <span
                className={cn(
                  "font-semibold",
                  isBearish ? "text-destructive" : "text-primary"
                )}
              >
                {trend || "Unknown"}
              </span>
            </div>

            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <p className="font-medium text-foreground mb-1">
            {assetName || "Unknown Asset"}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatDate(createdAt)}</span>
            {confidence !== null && confidence !== undefined && (
              <span>• {confidence}% confiança</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
