"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TrendsToolbar({ lastFetched }: { lastFetched?: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function refresh(sources: string[]) {
    setRunning(true);
    const label = sources.includes("tiktok") || sources.includes("reddit") ? "completo (2-3min)" : "rápido (~10s)";
    toast.info(`Buscando trends ${label}...`);
    try {
      const res = await fetch("/api/trends/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Erro" }));
        throw new Error(e.error || "Erro");
      }
      const data = await res.json();
      toast.success(`${data.total} trends · ${Math.round(data.duration_ms / 1000)}s`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {lastFetched && (
        <span className="text-xs text-muted-foreground">
          atualizado{" "}
          {new Date(lastFetched).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 h-8 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          disabled={running}
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {running ? "Buscando..." : "Atualizar"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => refresh(["google_trends", "news"])}>
            ⚡ Rápido — Google Trends + Notícias (~10s · free)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => refresh(["google_trends", "news", "twitter"])}>
            𝕏 + Twitter (~1min · ~$0.02)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => refresh(["google_trends", "news", "twitter", "reddit"])}>
            🅁 + Reddit (~2min · ~$0.05)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => refresh(["google_trends", "news", "twitter", "reddit", "tiktok"])}>
            🎵 Completo — + TikTok (~3min · ~$0.10)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
