import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type DailyPoint = {
  date: string;
  value: number;
};

type Props = {
  posts: DailyPoint[];
  searches: DailyPoint[];
  correlations: Array<{ lag: number; pearson: number; pairs: number }>;
};

export function BrandSearchBridge({ posts, searches, correlations }: Props) {
  const merged = mergeSeries(posts, searches);
  const maxPosts = Math.max(...merged.map((m) => m.posts), 1);
  const maxSearch = Math.max(...merged.map((m) => m.search), 1);

  const W = 720;
  const H = 220;
  const PAD = 40;

  const bestLag = correlations.reduce(
    (best, c) => (Math.abs(c.pearson) > Math.abs(best.pearson) ? c : best),
    { lag: 0, pearson: 0, pairs: 0 },
  );

  function xPos(i: number) {
    return PAD + (i / Math.max(merged.length - 1, 1)) * (W - 2 * PAD);
  }
  function yPosPosts(v: number) {
    return H - PAD - (v / maxPosts) * (H - 2 * PAD);
  }
  function yPosSearch(v: number) {
    return H - PAD - (v / maxSearch) * (H - 2 * PAD);
  }

  const searchPath = merged
    .map((m, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPosSearch(m.search)}`)
    .join(" ");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base">Bridge orgânico → busca pela marca</CardTitle>
            <CardDescription>
              Posts publicados (barras) vs sessions de busca (linha) — correlação lagged Pearson
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {correlations.map((c) => (
              <Badge
                key={c.lag}
                variant={c.lag === bestLag.lag && Math.abs(c.pearson) > 0.2 ? "default" : "outline"}
                className="text-[10px]"
                title={`${c.pairs} pares`}
              >
                lag {c.lag}d: r={c.pearson.toFixed(2)}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {merged.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados de GA4 conectados.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-4xl">
                {/* Eixos */}
                <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.3" />
                <line x1={W - PAD} y1={PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.3" />
                <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.3" />

                {/* Barras (posts) */}
                {merged.map((m, i) => {
                  const x = xPos(i);
                  const y = yPosPosts(m.posts);
                  const w = Math.max(((W - 2 * PAD) / merged.length) * 0.7, 2);
                  return (
                    <rect
                      key={`bar-${i}`}
                      x={x - w / 2}
                      y={y}
                      width={w}
                      height={H - PAD - y}
                      fill="currentColor"
                      fillOpacity={0.2}
                    />
                  );
                })}

                {/* Linha de busca */}
                <path d={searchPath} fill="none" stroke="rgb(34, 197, 94)" strokeWidth="2" />
                {merged.map((m, i) => (
                  <circle
                    key={`dot-${i}`}
                    cx={xPos(i)}
                    cy={yPosSearch(m.search)}
                    r="2.5"
                    fill="rgb(34, 197, 94)"
                  />
                ))}

                {/* Labels eixos Y */}
                <text x={PAD - 6} y={PAD + 4} textAnchor="end" className="text-[9px] fill-muted-foreground">
                  {maxPosts}
                </text>
                <text x={PAD - 6} y={H - PAD} textAnchor="end" className="text-[9px] fill-muted-foreground">
                  0
                </text>
                <text x={PAD - 18} y={H / 2} textAnchor="end" className="text-[9px] fill-muted-foreground">
                  posts
                </text>
                <text x={W - PAD + 6} y={PAD + 4} className="text-[9px] fill-green-600">
                  {maxSearch}
                </text>
                <text x={W - PAD + 6} y={H - PAD} className="text-[9px] fill-green-600">
                  0
                </text>
                <text x={W - PAD + 6} y={H / 2} className="text-[9px] fill-green-600">
                  busca
                </text>
              </svg>
            </div>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>
                {Math.abs(bestLag.pearson) > 0.4 ? (
                  <span className="inline-flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="text-foreground">Correlação forte</strong> com lag de{" "}
                      <strong className="text-foreground">{bestLag.lag} dia(s)</strong> (r={bestLag.pearson.toFixed(2)}). Posts em IG estão puxando busca pela marca.
                    </span>
                  </span>
                ) : Math.abs(bestLag.pearson) > 0.2 ? (
                  <span className="inline-flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                    <span>Correlação fraca (r={bestLag.pearson.toFixed(2)} no lag {bestLag.lag}d). Sinal incipiente — manter monitorando.</span>
                  </span>
                ) : (
                  <span className="inline-flex items-start gap-1.5">
                    <XCircle className="h-3.5 w-3.5 mt-0.5 text-destructive flex-shrink-0" aria-hidden="true" />
                    <span>Sem correlação clara. Posts orgânicos atuais não estão gerando search lift mensurável.</span>
                  </span>
                )}
              </p>
              <p className="text-[10px]">
                Métrica de busca: GA4 sessions de canal Direct + google/organic (proxy de brand
                search — GA4 não dá keywords explícitas).
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function mergeSeries(posts: DailyPoint[], searches: DailyPoint[]): Array<{ date: string; posts: number; search: number }> {
  const map = new Map<string, { posts: number; search: number }>();
  for (const p of posts) map.set(p.date, { posts: p.value, search: 0 });
  for (const s of searches) {
    const cur = map.get(s.date) ?? { posts: 0, search: 0 };
    cur.search = s.value;
    map.set(s.date, cur);
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
