"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ClusterPoint = {
  label: string;
  count: number;
  avgReach: number;
  avgSaveRate: number;
  avgShareRate: number;
  avgEngagementRate: number;
};

export function ThemeMatrix({ clusters }: { clusters: ClusterPoint[] }) {
  const [hover, setHover] = useState<ClusterPoint | null>(null);

  if (clusters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Format × Theme Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados</p>
        </CardContent>
      </Card>
    );
  }

  // Eixos: x = reach médio, y = save rate
  const maxReach = Math.max(...clusters.map((c) => c.avgReach), 1);
  const maxSave = Math.max(...clusters.map((c) => c.avgSaveRate), 0.01);
  const maxCount = Math.max(...clusters.map((c) => c.count), 1);

  const W = 720;
  const H = 420;
  const PAD = 50;

  function xPos(reach: number) {
    return PAD + (reach / maxReach) * (W - 2 * PAD);
  }
  function yPos(saveRate: number) {
    return H - PAD - (saveRate / maxSave) * (H - 2 * PAD);
  }
  function radius(count: number) {
    return 8 + (count / maxCount) * 22;
  }

  // Quadrante goldmine: reach alto (>50%) + save alto (>50%)
  const goldmineX = xPos(maxReach * 0.5);
  const goldmineY = yPos(maxSave * 0.5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Format × Theme Matrix</CardTitle>
        <CardDescription>
          Cada bolha = um tema. X = reach médio · Y = save rate · tamanho = nº peças.
          <span className="text-green-600 dark:text-green-400 font-medium"> Goldmine</span> = canto superior direito.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl">
              {/* Quadrante goldmine highlight */}
              <rect
                x={goldmineX}
                y={PAD}
                width={W - PAD - goldmineX}
                height={goldmineY - PAD}
                fill="rgba(34,197,94,0.06)"
              />

              {/* Linhas de divisão dos quadrantes */}
              <line x1={goldmineX} y1={PAD} x2={goldmineX} y2={H - PAD} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="4 4" />
              <line x1={PAD} y1={goldmineY} x2={W - PAD} y2={goldmineY} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="4 4" />

              {/* Eixos */}
              <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.3" />
              <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.3" />

              {/* Labels eixos */}
              <text x={W / 2} y={H - 10} textAnchor="middle" className="text-xs fill-muted-foreground">
                Reach médio →
              </text>
              <text
                x={15}
                y={H / 2}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
                transform={`rotate(-90 15 ${H / 2})`}
              >
                Save rate ↑
              </text>

              {/* Quadrante labels */}
              <text x={W - PAD - 8} y={PAD + 14} textAnchor="end" className="text-[10px] fill-green-600">
                GOLDMINE
              </text>
              <text x={PAD + 8} y={PAD + 14} className="text-[10px] fill-muted-foreground">
                Útil mas baixo alcance
              </text>
              <text x={W - PAD - 8} y={H - PAD - 8} textAnchor="end" className="text-[10px] fill-muted-foreground">
                Alcance sem profundidade
              </text>
              <text x={PAD + 8} y={H - PAD - 8} className="text-[10px] fill-destructive/60">
                Baixo desempenho
              </text>

              {/* Pontos */}
              {clusters.map((c, i) => {
                const cx = xPos(c.avgReach);
                const cy = yPos(c.avgSaveRate);
                const r = radius(c.count);
                const isGoldmine = c.avgReach > maxReach * 0.5 && c.avgSaveRate > maxSave * 0.5;
                return (
                  <g
                    key={c.label}
                    onMouseEnter={() => setHover(c)}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={isGoldmine ? "rgb(34 197 94 / 0.5)" : `hsl(${(i * 47) % 360} 70% 55% / 0.55)`}
                      stroke="currentColor"
                      strokeOpacity="0.4"
                      strokeWidth={hover?.label === c.label ? 2.5 : 1}
                    />
                    <text
                      x={cx}
                      y={cy + r + 12}
                      textAnchor="middle"
                      className="text-[10px] fill-foreground font-medium"
                    >
                      {c.label.length > 22 ? c.label.slice(0, 20) + "…" : c.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Painel detalhe */}
          <div className="w-full lg:w-72 space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {hover ? "Detalhe" : "Hover num ponto"}
            </div>
            {hover ? (
              <div className="space-y-2 border rounded-md p-3">
                <p className="font-medium text-sm">{hover.label}</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-muted-foreground">Peças:</span>
                  <span className="text-right tabular-nums font-medium">{hover.count}</span>
                  <span className="text-muted-foreground">Reach médio:</span>
                  <span className="text-right tabular-nums font-medium">
                    {Math.round(hover.avgReach).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-muted-foreground">Save rate:</span>
                  <span className="text-right tabular-nums font-medium">
                    {(hover.avgSaveRate * 100).toFixed(2)}%
                  </span>
                  <span className="text-muted-foreground">Share rate:</span>
                  <span className="text-right tabular-nums font-medium">
                    {(hover.avgShareRate * 100).toFixed(2)}%
                  </span>
                  <span className="text-muted-foreground">Eng rate:</span>
                  <span className="text-right tabular-nums font-medium">
                    {(hover.avgEngagementRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Todos os clusters</p>
              {clusters
                .slice()
                .sort((a, b) => b.avgReach * b.avgSaveRate - a.avgReach * a.avgSaveRate)
                .map((c) => (
                  <button
                    key={c.label}
                    onMouseEnter={() => setHover(c)}
                    onMouseLeave={() => setHover(null)}
                    className="w-full text-left text-xs border rounded p-2 hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex-1">{c.label}</span>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        {c.count}
                      </Badge>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
