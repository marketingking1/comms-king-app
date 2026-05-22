"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Trend = {
  id: string;
  source: string;
  topic: string;
  description?: string | null;
  url?: string | null;
  thumbnail_url?: string | null;
  volume_score?: number | null;
  king_relevance?: string;
  king_angle?: string | null;
  detected_at?: string;
};

const SOURCE_LABELS: Record<string, string> = {
  google_trends: "Google",
  tiktok: "TikTok",
  reddit: "Reddit",
  news: "Notícias",
};

const SOURCE_COLORS: Record<string, string> = {
  google_trends: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  tiktok: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
  reddit: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  news: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const RELEVANCE_COLOR: Record<string, string> = {
  high: "border-l-4 border-l-green-500",
  medium: "border-l-4 border-l-amber-500",
  low: "border-l-4 border-l-zinc-300 dark:border-l-zinc-700 opacity-70",
};

export function TrendCard({ trend }: { trend: Trend }) {
  const router = useRouter();
  const [promoting, setPromoting] = useState(false);

  async function promote() {
    setPromoting(true);
    try {
      const res = await fetch("/api/trends/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trendId: trend.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      toast.success("Pauta criada — abrindo...");
      router.push(`/zeitgeist/${data.zeitgeistId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
      setPromoting(false);
    }
  }

  return (
    <Card className={RELEVANCE_COLOR[trend.king_relevance || "unanalyzed"] || ""}>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start gap-2">
          <Badge className={`text-[10px] ${SOURCE_COLORS[trend.source] || ""}`} variant="outline">
            {SOURCE_LABELS[trend.source] || trend.source}
          </Badge>
          {trend.king_relevance === "high" && (
            <Badge variant="default" className="text-[10px]">⭐ Alta</Badge>
          )}
          {trend.king_relevance === "medium" && (
            <Badge variant="secondary" className="text-[10px]">Média</Badge>
          )}
          {trend.volume_score && trend.volume_score > 0 && (
            <Badge variant="outline" className="text-[10px] ml-auto">
              {formatVolume(trend.volume_score)}
            </Badge>
          )}
        </div>

        <h3 className="font-medium leading-snug text-sm line-clamp-2">
          {trend.topic}
        </h3>

        {trend.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {trend.description}
          </p>
        )}

        {trend.king_angle && trend.king_angle !== "sem ângulo" && (
          <div className="text-xs italic bg-primary/5 border-l-2 border-l-primary/60 pl-2 py-1">
            <span className="text-[10px] uppercase text-primary font-semibold not-italic block">
              Ângulo King
            </span>
            {trend.king_angle}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {trend.url && (
            <a
              href={trend.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              fonte
            </a>
          )}
          {trend.king_relevance !== "low" && trend.king_angle && trend.king_angle !== "sem ângulo" && (
            <Button
              size="xs"
              variant="outline"
              className="ml-auto"
              onClick={promote}
              disabled={promoting}
            >
              {promoting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Caçar pauta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toString();
}
