"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

type ClusterPoint = {
  label: string;
  count: number;
  avgReach: number;
  avgSaveRate: number;
  avgShareRate: number;
  avgEngagementRate: number;
};

// Paleta King — 8 cores distintas (loop com modulo)
const BUBBLE_COLORS = [
  "oklch(0.52 0.18 252)",   // brand-blue
  "oklch(0.7 0.18 28)",     // brand-coral
  "oklch(0.78 0.13 220)",   // brand-cyan
  "oklch(0.6 0.2 320)",     // pink
  "oklch(0.55 0.15 145)",   // green
  "oklch(0.7 0.16 80)",     // amber
  "oklch(0.6 0.22 27)",     // brand-red
  "oklch(0.55 0.18 192)",   // teal
];

export function ThemeMatrix({ clusters }: { clusters: ClusterPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (clusters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-coral" />
            Format × Theme Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados</p>
        </CardContent>
      </Card>
    );
  }

  // Ordena por score (reach × save) — bolha 1 = topo
  const ranked = clusters
    .map((c, originalIdx) => ({ ...c, originalIdx }))
    .sort((a, b) => b.avgReach * b.avgSaveRate - a.avgReach * a.avgSaveRate);

  // Eixos: x = reach médio, y = save rate
  const maxReach = Math.max(...clusters.map((c) => c.avgReach), 1);
  const maxSave = Math.max(...clusters.map((c) => c.avgSaveRate), 0.01);
  const maxCount = Math.max(...clusters.map((c) => c.count), 1);

  const W = 720;
  const H = 440;
  const PAD_L = 56;
  const PAD_R = 30;
  const PAD_T = 36;
  const PAD_B = 50;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  function xPos(reach: number) {
    return PAD_L + (reach / maxReach) * plotW;
  }
  function yPos(saveRate: number) {
    return H - PAD_B - (saveRate / maxSave) * plotH;
  }
  function radius(count: number) {
    return 12 + (count / maxCount) * 26;
  }

  const midX = xPos(maxReach * 0.5);
  const midY = yPos(maxSave * 0.5);
  const hovered = hoverIdx !== null ? ranked[hoverIdx] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-coral" />
              Format × Theme Matrix
            </CardTitle>
            <CardDescription className="mt-1">
              X = reach médio · Y = save rate · tamanho = nº de peças.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              <span className="text-muted-foreground">Goldmine</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted border" />
              <span className="text-muted-foreground">Demais quadrantes</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* GRÁFICO */}
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
              {/* Background goldmine */}
              <rect
                x={midX}
                y={PAD_T}
                width={W - PAD_R - midX}
                height={midY - PAD_T}
                fill="oklch(0.55 0.15 145 / 8%)"
                rx="6"
              />

              {/* Grid lines sutis */}
              {[0.25, 0.5, 0.75].map((p) => (
                <line
                  key={`gx-${p}`}
                  x1={PAD_L + p * plotW}
                  y1={PAD_T}
                  x2={PAD_L + p * plotW}
                  y2={H - PAD_B}
                  stroke="currentColor"
                  strokeOpacity={p === 0.5 ? "0.18" : "0.07"}
                  strokeDasharray={p === 0.5 ? "4 4" : "2 4"}
                />
              ))}
              {[0.25, 0.5, 0.75].map((p) => (
                <line
                  key={`gy-${p}`}
                  x1={PAD_L}
                  y1={H - PAD_B - p * plotH}
                  x2={W - PAD_R}
                  y2={H - PAD_B - p * plotH}
                  stroke="currentColor"
                  strokeOpacity={p === 0.5 ? "0.18" : "0.07"}
                  strokeDasharray={p === 0.5 ? "4 4" : "2 4"}
                />
              ))}

              {/* Eixos */}
              <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="currentColor" strokeOpacity="0.3" />
              <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="currentColor" strokeOpacity="0.3" />

              {/* Labels eixos */}
              <text x={(PAD_L + W - PAD_R) / 2} y={H - 14} textAnchor="middle" className="text-[11px] fill-muted-foreground font-medium">
                Reach médio →
              </text>
              <text
                x={20}
                y={(PAD_T + H - PAD_B) / 2}
                textAnchor="middle"
                className="text-[11px] fill-muted-foreground font-medium"
                transform={`rotate(-90 20 ${(PAD_T + H - PAD_B) / 2})`}
              >
                ↑ Save rate
              </text>

              {/* Quadrante labels — chips discretos nos cantos */}
              <g>
                <rect x={W - PAD_R - 86} y={PAD_T + 4} width={82} height={20} rx="10" fill="oklch(0.55 0.15 145 / 12%)" />
                <text x={W - PAD_R - 45} y={PAD_T + 18} textAnchor="middle" className="text-[10px] fill-emerald-700 dark:fill-emerald-400 font-semibold uppercase tracking-wider">
                  Goldmine
                </text>
              </g>
              <text x={PAD_L + 8} y={PAD_T + 16} className="text-[10px] fill-muted-foreground/70">
                Útil · baixo alcance
              </text>
              <text x={W - PAD_R - 8} y={H - PAD_B - 8} textAnchor="end" className="text-[10px] fill-muted-foreground/70">
                Alcance sem profundidade
              </text>
              <text x={PAD_L + 8} y={H - PAD_B - 8} className="text-[10px] fill-destructive/60">
                Baixo desempenho
              </text>

              {/* PONTOS — número dentro da bolha, nome no painel direito */}
              {ranked.map((c, i) => {
                const cx = xPos(c.avgReach);
                const cy = yPos(c.avgSaveRate);
                const r = radius(c.count);
                const isGoldmine = c.avgReach > maxReach * 0.5 && c.avgSaveRate > maxSave * 0.5;
                const color = isGoldmine
                  ? "oklch(0.55 0.15 145)"
                  : BUBBLE_COLORS[c.originalIdx % BUBBLE_COLORS.length];
                const isHover = hoverIdx === i;
                return (
                  <g
                    key={c.label}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    style={{ cursor: "pointer", transition: "transform 0.15s" }}
                  >
                    {/* Glow no hover */}
                    {isHover && (
                      <circle cx={cx} cy={cy} r={r + 6} fill={color} fillOpacity="0.15" />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={color}
                      fillOpacity={isHover ? 0.85 : 0.65}
                      stroke="white"
                      strokeWidth={2}
                    />
                    {/* Número dentro */}
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      className="text-xs font-bold fill-white pointer-events-none select-none"
                      style={{ fontSize: r > 18 ? 13 : 11 }}
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* LEGENDA + DETALHE */}
          <div className="space-y-4">
            {hovered ? (
              <div className="space-y-2 rounded-xl border bg-card p-4 shadow-sm">
                <p className="font-display font-semibold text-base leading-tight">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold mr-2 align-middle"
                    style={{
                      background: hovered.avgReach > maxReach * 0.5 && hovered.avgSaveRate > maxSave * 0.5
                        ? "oklch(0.55 0.15 145)"
                        : BUBBLE_COLORS[hovered.originalIdx % BUBBLE_COLORS.length],
                      color: "white",
                    }}
                  >
                    {hoverIdx! + 1}
                  </span>
                  {hovered.label}
                </p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-1">
                  <dt className="text-muted-foreground">Peças</dt>
                  <dd className="text-right font-semibold tabular-nums">{hovered.count}</dd>
                  <dt className="text-muted-foreground">Reach médio</dt>
                  <dd className="text-right font-semibold tabular-nums">
                    {Math.round(hovered.avgReach).toLocaleString("pt-BR")}
                  </dd>
                  <dt className="text-muted-foreground">Save rate</dt>
                  <dd className="text-right font-semibold tabular-nums">
                    {(hovered.avgSaveRate * 100).toFixed(2)}%
                  </dd>
                  <dt className="text-muted-foreground">Share rate</dt>
                  <dd className="text-right font-semibold tabular-nums">
                    {(hovered.avgShareRate * 100).toFixed(2)}%
                  </dd>
                  <dt className="text-muted-foreground">Eng rate</dt>
                  <dd className="text-right font-semibold tabular-nums">
                    {(hovered.avgEngagementRate * 100).toFixed(2)}%
                  </dd>
                </dl>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Passe o mouse num ponto pra ver detalhes
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-2">
                Ranking · {ranked.length} temas
              </p>
              <div className="space-y-1">
                {ranked.map((c, i) => {
                  const isGoldmine = c.avgReach > maxReach * 0.5 && c.avgSaveRate > maxSave * 0.5;
                  const color = isGoldmine
                    ? "oklch(0.55 0.15 145)"
                    : BUBBLE_COLORS[c.originalIdx % BUBBLE_COLORS.length];
                  return (
                    <button
                      key={c.label}
                      onMouseEnter={() => setHoverIdx(i)}
                      onMouseLeave={() => setHoverIdx(null)}
                      className={`w-full text-left text-xs rounded-lg px-2.5 py-2 hover:bg-accent/40 transition-colors cursor-pointer flex items-center gap-2.5 ${
                        hoverIdx === i ? "bg-accent/40" : ""
                      }`}
                    >
                      <span
                        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: color }}
                      >
                        {i + 1}
                      </span>
                      <span className="font-medium truncate flex-1">{c.label}</span>
                      <Badge variant="outline" className="text-[10px] tabular-nums flex-shrink-0">
                        {c.count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
