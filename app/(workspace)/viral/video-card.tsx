"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  MessageCircle,
  Heart,
  Eye,
  Check,
  X,
  Loader2,
  Undo2,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

export type ViralVideo = {
  id: string;
  platform: string;
  external_id: string;
  url: string;
  caption?: string | null;
  hashtag_source?: string | null;
  hashtags?: string[] | null;
  author_username?: string | null;
  author_full_name?: string | null;
  author_profile_url?: string | null;
  author_is_verified?: boolean | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  media_type?: string | null;
  views_count?: number | null;
  likes_count?: number | null;
  comments_count?: number | null;
  posted_at?: string | null;
  fetched_at?: string;
  status: "new" | "commented" | "skipped";
};

export function ViralVideoCard({ video }: { video: ViralVideo }) {
  const router = useRouter();
  const [marking, setMarking] = useState<"commented" | "skipped" | "new" | null>(null);

  async function mark(status: "commented" | "skipped" | "new") {
    setMarking(status);
    try {
      const res = await fetch("/api/viral/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      }
      const labelMap = { commented: "Marcado como comentado", skipped: "Pulado", new: "Voltado pra novos" };
      toast.success(labelMap[status]);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : "Erro");
    } finally {
      setMarking(null);
    }
  }

  const dimmedClass = video.status !== "new" ? "opacity-60" : "";

  return (
    <Card className={`overflow-hidden ${dimmedClass}`}>
      {/* Thumb com aspect 4:5 (típico Reels) */}
      <div className="relative aspect-[4/5] bg-muted">
        {video.thumbnail_url ? (
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="block w-full h-full group"
          >
            <Image
              src={video.thumbnail_url}
              alt={video.caption?.slice(0, 80) || "Reel"}
              fill
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-2 left-2 flex gap-1.5">
              {video.media_type === "video" && (
                <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-0 backdrop-blur">
                  Reel
                </Badge>
              )}
              {video.hashtag_source && (
                <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-0 backdrop-blur">
                  #{video.hashtag_source}
                </Badge>
              )}
            </div>
            {video.status === "commented" && (
              <div className="absolute top-2 right-2">
                <Badge className="text-[10px] bg-green-600 text-white border-0 gap-0.5">
                  <Check className="h-2.5 w-2.5" />
                  Comentei
                </Badge>
              </div>
            )}
            {video.status === "skipped" && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="text-[10px] bg-black/50 text-white border-0">
                  Pulei
                </Badge>
              </div>
            )}
          </a>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            sem thumb
          </div>
        )}
      </div>

      <CardContent className="pt-3 pb-3 space-y-2.5">
        {/* Autor */}
        <a
          href={video.author_profile_url ?? video.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 group min-w-0"
        >
          <span className="text-xs font-medium truncate group-hover:underline">
            @{video.author_username || "—"}
          </span>
          {video.author_is_verified && (
            <BadgeCheck className="h-3 w-3 text-blue-500 flex-shrink-0" aria-label="Verificado" />
          )}
        </a>

        {/* Caption */}
        {video.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {video.caption}
          </p>
        )}

        {/* Métricas */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {video.views_count != null && (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNum(video.views_count)}
            </span>
          )}
          {video.likes_count != null && (
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {formatNum(video.likes_count)}
            </span>
          )}
          {video.comments_count != null && (
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {formatNum(video.comments_count)}
            </span>
          )}
          {video.posted_at && (
            <span className="ml-auto text-[10px]">{timeAgo(video.posted_at)}</span>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-1.5 pt-1">
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1 h-6 px-2 rounded-md text-xs font-medium border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir no IG
          </a>

          {video.status === "new" ? (
            <>
              <Button
                size="xs"
                variant="default"
                onClick={() => mark("commented")}
                disabled={marking !== null}
                title="Marcar que já comentei nesse"
              >
                {marking === "commented" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Comentei
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => mark("skipped")}
                disabled={marking !== null}
                title="Não vou comentar"
              >
                {marking === "skipped" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              </Button>
            </>
          ) : (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => mark("new")}
              disabled={marking !== null}
              title="Voltar pra novos"
            >
              {marking === "new" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3600_000);
  if (hours < 1) return "agora";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
