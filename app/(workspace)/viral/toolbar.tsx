"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ViralToolbar({ lastFetched }: { lastFetched?: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function refresh() {
    setRunning(true);
    const toastId = toast.loading("Buscando virais no Instagram... (~2min)", { duration: Infinity });
    try {
      const res = await fetch("/api/viral/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      toast.success(
        `${data.total} virais · ${Math.round((data.duration_ms || 0) / 1000)}s`,
        { id: toastId, duration: 4000 },
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 300) : "Erro", {
        id: toastId,
        duration: 8000,
      });
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
      <button
        type="button"
        onClick={refresh}
        disabled={running}
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 h-9 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-colors"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {running ? "Buscando..." : "Atualizar"}
      </button>
    </div>
  );
}
