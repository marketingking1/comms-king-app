import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAccountInfo,
  getAccountInsights,
  listMedia,
  getMediaInsights,
  type IgMedia,
} from "@/lib/instagram/graph";
import {
  type PieceWithInsights,
  shareRate,
  saveRate,
  commentRate,
  engagementRate,
  watchThroughRate,
  profileVisitRate,
  statsByFormat,
  buildHeatmap,
  statsByHashtag,
  statsByCaptionLength,
  top,
  bottom,
  wordsTopVsBottom,
  recentVelocity,
  comparePerformance,
} from "@/lib/instagram/analytics";
import {
  calculateWeeklyScore,
  clusterByTheme,
  correlateLagged,
  buildDailyPostsSeries,
} from "@/lib/instagram/analytics-advanced";
import { AlertTriangle, TrendingUp, TrendingDown, Eye, Users, MousePointerClick, Heart } from "lucide-react";
import { HypothesisPanel } from "./hypothesis-panel";
import { ScoreHero } from "./score-hero";
import { HookDna } from "./hook-dna";
import { ThemeMatrix } from "./theme-matrix";
import { BrandSearchBridge } from "./brand-search-bridge";
import { BigIdeasLab } from "./big-ideas-lab";
import { getBrandTrafficDaily } from "@/lib/ga4/brand-search";
import { getPropertyId } from "@/lib/ga4/client";
import { pLimit } from "@/lib/utils/p-limit";

export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function AnalyticsPage() {
  let accountInfo, insights, prevInsights, mediaList: IgMedia[] = [];
  let error: string | null = null;

  try {
    [accountInfo, insights, prevInsights, mediaList] = await Promise.all([
      getAccountInfo(),
      getAccountInsights(DAYS),
      getAccountInsights(DAYS, DAYS),
      listMedia(60),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Insights por peça — concurrency limit ≤5 pra não bater IG rate limit (200/h)
  const limit = pLimit(5);
  const allPieces: PieceWithInsights[] = await Promise.all(
    (mediaList || []).map((m) =>
      limit(async () => ({
        media: m,
        insights: await getMediaInsights(m.id, m.media_product_type === "REELS").catch(() => ({})),
      })),
    ),
  );

  // Divide em current/previous baseado em data
  const cutDate = Date.now() - DAYS * 24 * 3600 * 1000;
  const previousCutDate = Date.now() - 2 * DAYS * 24 * 3600 * 1000;
  const currentPieces = allPieces.filter((p) => new Date(p.media.timestamp).getTime() >= cutDate);
  const previousPieces = allPieces.filter((p) => {
    const ts = new Date(p.media.timestamp).getTime();
    return ts >= previousCutDate && ts < cutDate;
  });

  const compare = comparePerformance(currentPieces, previousPieces);
  const formatStats = statsByFormat(currentPieces);
  const heatmap = buildHeatmap(allPieces);
  const hashtagStats = statsByHashtag(currentPieces);
  const captionBuckets = statsByCaptionLength(currentPieces);

  const topShare = top(currentPieces, shareRate, 10);
  const topSave = top(currentPieces, saveRate, 5);
  const topComment = top(currentPieces, commentRate, 5);
  const topWatch = top(
    currentPieces.filter((p) => p.media.media_product_type === "REELS"),
    watchThroughRate,
    5,
  );
  const topEngagement = top(currentPieces, engagementRate, 5);
  const bottomShare = bottom(currentPieces, shareRate, 10);
  const velocity = recentVelocity(allPieces);
  const wordLift = wordsTopVsBottom(topShare, bottomShare).slice(0, 15);

  // Theme clusters
  const themeClusters = clusterByTheme(currentPieces);

  // Score semanal
  const followerGrowth = insights?.daily.reduce((s, d) => s + d.follower_count, 0) || 0;
  const score = calculateWeeklyScore(
    currentPieces,
    previousPieces,
    followerGrowth,
    0,
    insights?.totals.profile_views || 0,
    insights?.totals.website_clicks || 0,
  );
  const avgEng = currentPieces.length > 0
    ? currentPieces.reduce((s, p) => s + engagementRate(p), 0) / currentPieces.length
    : 0;
  const dominantFormat = Array.from(formatStats.entries()).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || "—";

  // GA4 brand search bridge (se conectado)
  let gaPosts: Array<{ date: string; value: number }> = [];
  let gaSearches: Array<{ date: string; value: number }> = [];
  let gaCorrelations: Array<{ lag: number; pearson: number; pairs: number }> = [];
  try {
    const propertyId = await getPropertyId();
    if (propertyId) {
      const brandTraffic = await getBrandTrafficDaily(DAYS);
      const postsDaily = buildDailyPostsSeries(currentPieces, DAYS);
      gaPosts = postsDaily.map((d) => ({ date: d.date, value: d.posts }));
      gaSearches = brandTraffic.map((d) => ({ date: d.date, value: d.sessions }));
      // Correlação lagged
      const postsValues = postsDaily.map((d) => d.posts);
      const searchValues = brandTraffic.map((d) => d.sessions);
      gaCorrelations = correlateLagged(postsValues, searchValues, 4);
    }
  } catch {
    // GA4 não conectado — ok, painel mostra mensagem
  }

  // Contexto resumido pra agente
  const analyticsContext = buildContext({
    accountInfo,
    insights,
    compare,
    formatStats,
    topShare,
    topSave,
    topComment,
    bottomShare,
    hashtagStats: hashtagStats.slice(0, 15),
    captionBuckets,
    wordLift,
    heatmap,
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics Instagram</h1>
        <p className="text-muted-foreground mt-1">
          Análises sofisticadas + hipóteses geradas pelo squad — últimos {DAYS} dias
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="font-medium">Erro ao consultar IG Graph</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HERO + SCORE + NARRATIVA */}
      {accountInfo && (
        <ScoreHero
          username={accountInfo.username}
          followers={accountInfo.followers_count}
          score={score}
          reach={compare.current.reach}
          reachDelta={compare.delta.reach}
          avgEng={avgEng}
          pieces={currentPieces.length}
          dominantFormat={dominantFormat}
          profileCTR={
            (insights?.totals.website_clicks || 0) /
            Math.max(insights?.totals.profile_views || 1, 1)
          }
        />
      )}

      {/* HEADER conta */}
      {accountInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {accountInfo.profile_picture_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={accountInfo.profile_picture_url}
                  alt={accountInfo.username}
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div>
                <CardTitle className="text-lg">@{accountInfo.username}</CardTitle>
                <CardDescription>
                  {accountInfo.followers_count.toLocaleString("pt-BR")} seguidores · {accountInfo.media_count} posts totais · {currentPieces.length} peças nos últimos {DAYS}d
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* KPIs comparativos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo período</CardTitle>
          <CardDescription>
            Últimos {DAYS}d vs {DAYS}d anteriores
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <DeltaCard label="Peças" current={compare.current.count} previous={compare.previous.count} icon={TrendingUp} />
          <DeltaCard label="Alcance" current={compare.current.reach} previous={compare.previous.reach} delta={compare.delta.reach} icon={Eye} />
          <DeltaCard label="Interações" current={compare.current.engagement} previous={compare.previous.engagement} delta={compare.delta.engagement} icon={Heart} />
          <DeltaCard label="Saves" current={compare.current.saves} previous={compare.previous.saves} delta={compare.delta.saves} icon={Users} />
          <DeltaCard label="Shares" current={compare.current.shares} previous={compare.previous.shares} delta={compare.delta.shares} icon={MousePointerClick} />
        </CardContent>
      </Card>

      {/* Insights conta-level */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Alcance total 30d" value={insights.daily.reduce((s, d) => s + d.reach, 0).toLocaleString("pt-BR")} />
          <Stat label="Profile views" value={(insights.totals.profile_views || 0).toLocaleString("pt-BR")} />
          <Stat label="Website clicks" value={(insights.totals.website_clicks || 0).toLocaleString("pt-BR")} />
          <Stat label="Accounts engaged" value={(insights.totals.accounts_engaged || 0).toLocaleString("pt-BR")} />
        </div>
      )}

      {/* Format breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance por formato</CardTitle>
          <CardDescription>Onde investir tempo da editora</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="text-left py-2 pr-2">Formato</th>
                <th className="text-right py-2 pr-2">Peças</th>
                <th className="text-right py-2 pr-2">Reach total</th>
                <th className="text-right py-2 pr-2">Avg Reach</th>
                <th className="text-right py-2 pr-2">Avg Share %</th>
                <th className="text-right py-2 pr-2">Avg Save %</th>
                <th className="text-right py-2 pr-2">Avg Eng %</th>
              </tr>
            </thead>
            <tbody>
              {[...formatStats.entries()]
                .sort((a, b) => b[1].reach - a[1].reach)
                .map(([format, s]) => (
                  <tr key={format} className="border-b">
                    <td className="py-2 pr-2 font-medium">{format}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{s.count}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{s.reach.toLocaleString("pt-BR")}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {(s.reach / Math.max(s.count, 1)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{(s.avgShareRate * 100).toFixed(2)}%</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{(s.avgSaveRate * 100).toFixed(2)}%</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{(s.avgEngagementRate * 100).toFixed(2)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Heatmap dia x hora */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Heatmap dia × hora</CardTitle>
          <CardDescription>Reach médio por slot — quando publicar</CardDescription>
        </CardHeader>
        <CardContent>
          <Heatmap cells={heatmap} />
        </CardContent>
      </Card>

      {/* TOP & BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopPiecesCard title="🚀 TOP por share rate" pieces={topShare} metric={shareRate} unit="%" />
        <TopPiecesCard title="💾 TOP por save rate" pieces={topSave} metric={saveRate} unit="%" />
        <TopPiecesCard title="💬 TOP por comment rate" pieces={topComment} metric={commentRate} unit="%" />
        <TopPiecesCard title="⏱️ TOP Reels por watch %" pieces={topWatch} metric={watchThroughRate} unit="%" />
        <TopPiecesCard title="🔥 TOP por engagement" pieces={topEngagement} metric={engagementRate} unit="%" />
        <TopPiecesCard title="❄️ BOTTOM por share rate" pieces={bottomShare} metric={shareRate} unit="%" inverted />
      </div>

      {/* Velocity */}
      {velocity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">⚡ Velocity — publicadas nas últimas 72h</CardTitle>
            <CardDescription>Peças recém-publicadas com tração acima da média (replicar formato)</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left py-2 pr-2">Publicada</th>
                  <th className="text-left py-2 pr-2">Tipo</th>
                  <th className="text-left py-2 pr-2">Caption</th>
                  <th className="text-right py-2 pr-2">Reach</th>
                  <th className="text-right py-2 pr-2">Share %</th>
                  <th className="text-right py-2 pr-2">Save %</th>
                </tr>
              </thead>
              <tbody>
                {velocity.slice(0, 10).map((p) => (
                  <tr key={p.media.id} className="border-b hover:bg-accent/30">
                    <td className="py-2 pr-2 text-muted-foreground">
                      {new Date(p.media.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 pr-2">
                      <Badge variant="outline" className="text-[10px]">{p.media.media_product_type || p.media.media_type}</Badge>
                    </td>
                    <td className="py-2 pr-2 max-w-xs truncate">
                      <a href={p.media.permalink} target="_blank" className="hover:underline" rel="noreferrer">
                        {(p.media.caption || "").slice(0, 60)}
                      </a>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{p.insights.reach || 0}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{(shareRate(p) * 100).toFixed(2)}%</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{(saveRate(p) * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Hashtag analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base"># Performance por hashtag</CardTitle>
          <CardDescription>Top 15 por reach total (frequência × alcance médio)</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="text-left py-2 pr-2">Hashtag</th>
                <th className="text-right py-2 pr-2">Usos</th>
                <th className="text-right py-2 pr-2">Reach médio</th>
                <th className="text-right py-2 pr-2">Eng médio</th>
                <th className="text-right py-2 pr-2">Share rate médio</th>
              </tr>
            </thead>
            <tbody>
              {hashtagStats.slice(0, 15).map((h) => (
                <tr key={h.tag} className="border-b">
                  <td className="py-2 pr-2 font-mono text-[10px]">#{h.tag}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{h.count}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{Math.round(h.avgReach).toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{(h.avgEngagement * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{(h.avgShareRate * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Caption length analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Caption length — qual tamanho performa</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="text-left py-2 pr-2">Faixa (chars)</th>
                <th className="text-right py-2 pr-2">Peças</th>
                <th className="text-right py-2 pr-2">Reach médio</th>
                <th className="text-right py-2 pr-2">Share %</th>
                <th className="text-right py-2 pr-2">Eng %</th>
              </tr>
            </thead>
            <tbody>
              {captionBuckets.map((b) => (
                <tr key={b.range} className="border-b">
                  <td className="py-2 pr-2 font-mono text-[10px]">{b.range}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{b.count}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {b.count > 0 ? Math.round(b.avgReach).toLocaleString("pt-BR") : "-"}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {b.count > 0 ? `${(b.avgShareRate * 100).toFixed(2)}%` : "-"}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {b.count > 0 ? `${(b.avgEngagement * 100).toFixed(2)}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Word lift — palavras vencedoras */}
      {wordLift.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Palavras vencedoras (Top vs Bottom)</CardTitle>
            <CardDescription>
              Palavras que aparecem mais nas peças TOP de share rate. Lift &gt; 2 = forte sinal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {wordLift.map((w) => (
                <Badge
                  key={w.word}
                  variant={w.lift > 3 ? "default" : w.lift > 2 ? "secondary" : "outline"}
                  className="text-xs"
                  title={`Top: ${(w.topRatio * 100).toFixed(0)}% · Bottom: ${(w.bottomRatio * 100).toFixed(0)}%`}
                >
                  {w.word} <span className="opacity-60 ml-1">×{w.lift.toFixed(1)}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ NOVAS SEÇÕES SOFISTICADAS ============ */}

      {/* Format × Theme Matrix */}
      <ThemeMatrix
        clusters={themeClusters.map((c) => ({
          label: c.label,
          count: c.pieces.length,
          avgReach: c.avgReach,
          avgSaveRate: c.avgSaveRate,
          avgShareRate: c.avgShareRate,
          avgEngagementRate: c.avgEngagementRate,
        }))}
      />

      {/* Hook DNA decomposer */}
      <HookDna
        topPieces={topShare.map((p) => ({
          id: p.media.id,
          caption: p.media.caption || "",
          permalink: p.media.permalink,
          reach: p.insights.reach || 0,
          share_rate: shareRate(p),
          format: p.media.media_product_type || p.media.media_type,
        }))}
        bottomPieces={bottomShare.map((p) => ({
          id: p.media.id,
          caption: p.media.caption || "",
          permalink: p.media.permalink,
          reach: p.insights.reach || 0,
          share_rate: shareRate(p),
          format: p.media.media_product_type || p.media.media_type,
        }))}
      />

      {/* Brand search bridge */}
      <BrandSearchBridge
        posts={gaPosts}
        searches={gaSearches}
        correlations={gaCorrelations}
      />

      {/* Hipóteses via agente */}
      <HypothesisPanel analyticsContext={analyticsContext} />

      {/* Big Ideas Lab — million-strategist */}
      <BigIdeasLab
        context={{
          score: score.total,
          delta: score.delta,
          topHooks: topShare.slice(0, 5).map((p) =>
            `(reach ${p.insights.reach}, share ${(shareRate(p) * 100).toFixed(2)}%) "${(p.media.caption || "").slice(0, 150)}"`
          ).join("\n"),
          topClusters: themeClusters.slice(0, 3).map((c) =>
            `${c.label}: ${c.pieces.length} peças, avg reach ${Math.round(c.avgReach)}, save ${(c.avgSaveRate * 100).toFixed(2)}%`
          ).join("\n"),
          saturatedClusters: themeClusters.filter((c) => c.pieces.length >= 3 && c.avgEngagementRate < avgEng * 0.7).slice(0, 3).map((c) =>
            `${c.label}: ${c.pieces.length} peças, eng abaixo da média`
          ).join("\n"),
          goldmine: themeClusters.filter((c) => c.avgReach > 800 && c.avgSaveRate > 0.005).slice(0, 3).map((c) =>
            `${c.label}: reach ${Math.round(c.avgReach)}, save ${(c.avgSaveRate * 100).toFixed(2)}%`
          ).join("\n") || "—",
          brandSearchLift: gaCorrelations.length > 0
            ? gaCorrelations.map((c) => `lag ${c.lag}d: r=${c.pearson.toFixed(2)}`).join(", ")
            : "GA4 não conectado ou sem dados suficientes",
          anomalies: [
            velocity.length > 0 ? `Velocity 72h: ${velocity.length} peças acelerando` : null,
            topShare[0] ? `Top share rate: ${(shareRate(topShare[0]) * 100).toFixed(2)}% — "${(topShare[0].media.caption || "").slice(0, 80)}"` : null,
            bottomShare[0] ? `Bottom share rate: ${(shareRate(bottomShare[0]) * 100).toFixed(2)}%` : null,
          ].filter(Boolean).join("\n"),
        }}
      />
    </div>
  );
}

// ============ COMPONENTES ============

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function DeltaCard({
  label,
  current,
  previous,
  delta,
  icon: Icon,
}: {
  label: string;
  current: number;
  previous: number;
  delta?: number;
  icon: typeof TrendingUp;
}) {
  const d = delta ?? (previous > 0 ? ((current - previous) / previous) * 100 : 0);
  const isUp = d > 0;
  const ArrowIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className="border rounded-md p-3 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="h-3 w-3 text-muted-foreground" />
      </div>
      <p className="text-xl font-semibold tabular-nums">{current.toLocaleString("pt-BR")}</p>
      <p className={`text-[10px] flex items-center gap-1 ${isUp ? "text-green-600" : "text-destructive"}`}>
        <ArrowIcon className="h-3 w-3" />
        {d > 0 ? "+" : ""}
        {d.toFixed(1)}% vs anterior
      </p>
    </div>
  );
}

function TopPiecesCard({
  title,
  pieces,
  metric,
  unit,
  inverted,
}: {
  title: string;
  pieces: PieceWithInsights[];
  metric: (p: PieceWithInsights) => number;
  unit: string;
  inverted?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {pieces.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dados</p>
        ) : (
          <div className="space-y-2">
            {pieces.map((p) => (
              <a
                key={p.media.id}
                href={p.media.permalink}
                target="_blank"
                rel="noreferrer"
                className="block border rounded p-2 hover:bg-accent/30 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{(p.media.caption || "").slice(0, 100)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(p.media.timestamp).toLocaleDateString("pt-BR")} · {p.media.media_product_type || p.media.media_type} · {p.insights.reach || 0} reach
                    </p>
                  </div>
                  <Badge variant={inverted ? "destructive" : "default"} className="text-[10px]">
                    {unit === "%" ? `${(metric(p) * 100).toFixed(2)}%` : metric(p).toFixed(0)}
                  </Badge>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Heatmap({ cells }: { cells: Array<{ dayOfWeek: number; hour: number; count: number; avgReach: number; avgShareRate: number }> }) {
  const DAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  // Construir grid
  const grid: Record<string, { count: number; avgReach: number; avgShareRate: number }> = {};
  for (const c of cells) {
    grid[`${c.dayOfWeek}-${c.hour}`] = c;
  }

  const max = Math.max(...cells.map((c) => c.avgReach), 1);

  return (
    <div className="overflow-x-auto">
      <table className="text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="p-1"></th>
            {HOURS.map((h) => (
              <th key={h} className="p-1 text-muted-foreground font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, dIdx) => (
            <tr key={day}>
              <td className="p-1 text-muted-foreground pr-2">{day}</td>
              {HOURS.map((h) => {
                const cell = grid[`${dIdx}-${h}`];
                const intensity = cell ? cell.avgReach / max : 0;
                return (
                  <td
                    key={h}
                    className="w-5 h-5 border border-border/20"
                    style={{
                      background: cell ? `rgba(59,130,246,${0.1 + intensity * 0.85})` : "transparent",
                    }}
                    title={cell ? `${day} ${h}h · ${cell.count} peças · reach médio ${Math.round(cell.avgReach)} · share ${(cell.avgShareRate * 100).toFixed(1)}%` : ""}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground mt-2">
        Cor mais escura = maior alcance médio. Passe o mouse pra ver detalhes.
      </p>
    </div>
  );
}

// ============ CONTEXT BUILDER ============

type ContextInput = {
  accountInfo?: { username: string; followers_count: number; media_count: number };
  insights?: { totals: { profile_views?: number; website_clicks?: number; accounts_engaged?: number } };
  compare: ReturnType<typeof comparePerformance>;
  formatStats: Map<string, ReturnType<typeof statsByFormat> extends Map<string, infer V> ? V : never>;
  topShare: PieceWithInsights[];
  topSave: PieceWithInsights[];
  topComment: PieceWithInsights[];
  bottomShare: PieceWithInsights[];
  hashtagStats: ReturnType<typeof statsByHashtag>;
  captionBuckets: ReturnType<typeof statsByCaptionLength>;
  wordLift: ReturnType<typeof wordsTopVsBottom>;
  heatmap: ReturnType<typeof buildHeatmap>;
};

function buildContext(d: ContextInput): string {
  const lines: string[] = [];
  if (d.accountInfo) {
    lines.push(`CONTA: @${d.accountInfo.username} · ${d.accountInfo.followers_count} seguidores · ${d.accountInfo.media_count} posts totais`);
  }
  if (d.insights) {
    lines.push(`OVERVIEW 30d: profile_views=${d.insights.totals.profile_views || 0} · website_clicks=${d.insights.totals.website_clicks || 0} · accounts_engaged=${d.insights.totals.accounts_engaged || 0}`);
  }
  lines.push("");
  lines.push(`COMPARATIVO 30d vs 30d-anterior:`);
  lines.push(`  Peças: ${d.compare.current.count} (era ${d.compare.previous.count})`);
  lines.push(`  Reach: ${d.compare.current.reach.toLocaleString("pt-BR")} (${d.compare.delta.reach.toFixed(1)}%)`);
  lines.push(`  Engagement: ${d.compare.current.engagement.toLocaleString("pt-BR")} (${d.compare.delta.engagement.toFixed(1)}%)`);
  lines.push(`  Saves: ${d.compare.current.saves} (${d.compare.delta.saves.toFixed(1)}%)`);
  lines.push(`  Shares: ${d.compare.current.shares} (${d.compare.delta.shares.toFixed(1)}%)`);
  lines.push("");
  lines.push("PERFORMANCE POR FORMATO:");
  for (const [format, s] of d.formatStats) {
    lines.push(`  ${format}: ${s.count} peças · avg reach ${Math.round(s.reach / Math.max(s.count, 1))} · avg share ${(s.avgShareRate * 100).toFixed(2)}% · avg save ${(s.avgSaveRate * 100).toFixed(2)}% · avg eng ${(s.avgEngagementRate * 100).toFixed(2)}%`);
  }
  lines.push("");
  lines.push("TOP 5 SHARE RATE:");
  for (const p of d.topShare) {
    lines.push(`  ${(shareRate(p) * 100).toFixed(2)}% · ${p.media.media_product_type || p.media.media_type} · "${(p.media.caption || "").slice(0, 80)}..."`);
  }
  lines.push("");
  lines.push("BOTTOM 5 SHARE RATE (reach>50):");
  for (const p of d.bottomShare) {
    lines.push(`  ${(shareRate(p) * 100).toFixed(2)}% · ${p.media.media_product_type || p.media.media_type} · "${(p.media.caption || "").slice(0, 80)}..."`);
  }
  lines.push("");
  lines.push("TOP 5 SAVE RATE:");
  for (const p of d.topSave) {
    lines.push(`  ${(saveRate(p) * 100).toFixed(2)}% · "${(p.media.caption || "").slice(0, 80)}..."`);
  }
  lines.push("");
  lines.push("TOP 5 COMMENT RATE:");
  for (const p of d.topComment) {
    lines.push(`  ${(commentRate(p) * 100).toFixed(2)}% · "${(p.media.caption || "").slice(0, 80)}..."`);
  }
  lines.push("");
  lines.push("TOP 15 HASHTAGS POR REACH:");
  for (const h of d.hashtagStats) {
    lines.push(`  #${h.tag}: ${h.count} usos · ${Math.round(h.avgReach)} reach médio · ${(h.avgShareRate * 100).toFixed(2)}% share`);
  }
  lines.push("");
  lines.push("CAPTION LENGTH:");
  for (const b of d.captionBuckets) {
    if (b.count === 0) continue;
    lines.push(`  ${b.range} chars: ${b.count} peças · reach ${Math.round(b.avgReach)} · share ${(b.avgShareRate * 100).toFixed(2)}%`);
  }
  lines.push("");
  lines.push("PALAVRAS COM LIFT > 2 (top vs bottom):");
  for (const w of d.wordLift.slice(0, 10)) {
    lines.push(`  "${w.word}": ${(w.topRatio * 100).toFixed(0)}% top vs ${(w.bottomRatio * 100).toFixed(0)}% bottom (×${w.lift.toFixed(1)})`);
  }
  lines.push("");
  lines.push("HEATMAP DIA × HORA (top 10 slots por reach médio):");
  const sortedHeat = [...d.heatmap].sort((a, b) => b.avgReach - a.avgReach).slice(0, 10);
  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  for (const c of sortedHeat) {
    lines.push(`  ${days[c.dayOfWeek]} ${c.hour}h: ${c.count} peças · reach ${Math.round(c.avgReach)} · share ${(c.avgShareRate * 100).toFixed(2)}%`);
  }
  return lines.join("\n");
}
