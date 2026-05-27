"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViralVideoCard, type ViralVideo } from "./video-card";

const STORAGE_KEY = "viral-min-comments";
const PRESETS = [100, 200, 500, 1000, 2000, 5000] as const;
const MIN_STEP = 0;
const MAX_STEP = PRESETS.length - 1;
const DEFAULT_PRESET_INDEX = PRESETS.indexOf(500); // = 2

export function ViralList({ videos }: { videos: ViralVideo[] }) {
  const [stepIdx, setStepIdx] = useState<number>(DEFAULT_PRESET_INDEX);
  const [hydrated, setHydrated] = useState(false);

  // Hidrata do localStorage só no cliente (evita mismatch SSR)
  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw != null) {
      const n = parseInt(raw, 10);
      const idx = PRESETS.findIndex((p) => p === n);
      if (idx >= 0) setStepIdx(idx);
    }
    setHydrated(true);
  }, []);

  // Persiste mudanças
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, String(PRESETS[stepIdx]));
  }, [stepIdx, hydrated]);

  const minComments = PRESETS[stepIdx];

  const filtered = useMemo(
    () => videos.filter((v) => (v.comments_count ?? 0) >= minComments),
    [videos, minComments],
  );

  const novos = useMemo(() => filtered.filter((v) => v.status === "new"), [filtered]);
  const comentados = useMemo(() => filtered.filter((v) => v.status === "commented"), [filtered]);
  const skipped = useMemo(() => filtered.filter((v) => v.status === "skipped"), [filtered]);

  return (
    <div className="space-y-4">
      <Card className="bg-muted/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="min-w-0 flex-shrink-0">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Mín. comentários
              </p>
              <p className="text-2xl font-semibold tabular-nums leading-tight">
                {formatNum(minComments)}+
              </p>
            </div>

            <div className="flex-1 min-w-[200px] max-w-md">
              <input
                type="range"
                min={MIN_STEP}
                max={MAX_STEP}
                step={1}
                value={stepIdx}
                onChange={(e) => setStepIdx(parseInt(e.target.value, 10))}
                aria-label="Filtro mínimo de comentários"
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-primary
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:cursor-pointer"
              />
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground tabular-nums">
                {PRESETS.map((p, i) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setStepIdx(i)}
                    className={`cursor-pointer transition-colors ${i === stepIdx ? "text-foreground font-semibold" : "hover:text-foreground"}`}
                  >
                    {formatNum(p)}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground ml-auto">
              <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span>
              {" "}de {videos.length} reels
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="novos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="novos">Novos ({novos.length})</TabsTrigger>
          <TabsTrigger value="comentados">Comentei ({comentados.length})</TabsTrigger>
          <TabsTrigger value="skipped">Pulei ({skipped.length})</TabsTrigger>
          <TabsTrigger value="all">Tudo ({filtered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="novos">
          <VideoGrid videos={novos} emptyMessage="Sem virais novos nesse threshold. Diminua o filtro ou rode Atualizar." />
        </TabsContent>

        <TabsContent value="comentados">
          <VideoGrid videos={comentados} emptyMessage="Ainda não comentou em nenhum." />
        </TabsContent>

        <TabsContent value="skipped">
          <VideoGrid videos={skipped} emptyMessage="Nenhum pulado." />
        </TabsContent>

        <TabsContent value="all">
          <VideoGrid videos={filtered} emptyMessage="—" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VideoGrid({ videos, emptyMessage }: { videos: ViralVideo[]; emptyMessage: string }) {
  if (!videos.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((v) => (
        <ViralVideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return n.toString();
}
