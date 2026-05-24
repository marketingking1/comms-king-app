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
    const toastId = toast.loading(`Buscando trends ${label}...`, { duration: Infinity });
    try {
      const res = await fetch("/api/trends/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.error || body?.message || `HTTP ${res.status}`;
        // Se tem summary, mostra quais sources falharam
        if (body?.summary) {
          const failed = Object.entries(body.summary as Record<string, { count: number; error?: string }>)
            .filter(([, v]) => v.error)
            .map(([k, v]) => `${k}: ${v.error?.slice(0, 80)}`)
            .join(" · ");
          throw new Error(`${msg}${failed ? ` — ${failed}` : ""}`);
        }
        throw new Error(msg);
      }
      const data = await res.json();
      const partialFails = data.summary
        ? Object.entries(data.summary as Record<string, { count: number; error?: string }>)
            .filter(([, v]) => v.error)
            .map(([k]) => k)
        : [];
      const baseMsg = `${data.total} trends · ${Math.round(data.duration_ms / 1000)}s`;
      if (partialFails.length > 0) {
        toast.warning(`${baseMsg} (${partialFails.join(", ")} falharam)`, { id: toastId, duration: 6000 });
      } else {
        toast.success(baseMsg, { id: toastId, duration: 4000 });
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 300) : "Erro", { id: toastId, duration: 8000 });
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
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 h-9 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-colors"
          disabled={running}
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {running ? "Buscando..." : "Atualizar"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => refresh(["google_trends", "news"])} className="cursor-pointer">
            Rápido — Google Trends + Notícias (~10s · free)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => refresh(["google_trends", "news", "twitter"])} className="cursor-pointer">
            + Twitter (~1min · ~$0.02)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => refresh(["google_trends", "news", "twitter", "reddit"])} className="cursor-pointer">
            + Reddit (~2min · ~$0.05)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => refresh(["google_trends", "news", "twitter", "reddit", "tiktok"])} className="cursor-pointer">
            Completo — + TikTok (~3min · ~$0.10)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
