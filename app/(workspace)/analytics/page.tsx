import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAccountInfo, getAccountInsights, listMedia, getMediaInsights, type IgMedia, type MediaInsights } from "@/lib/instagram/graph";
import { AlertTriangle, TrendingUp, Eye, Users, MousePointerClick } from "lucide-react";

export const revalidate = 600;

type PieceWithInsights = { media: IgMedia; insights: MediaInsights };

export default async function AnalyticsPage() {
  let accountInfo: Awaited<ReturnType<typeof getAccountInfo>> | undefined;
  let insights: Awaited<ReturnType<typeof getAccountInsights>> | undefined;
  let media: IgMedia[] | undefined;
  let error: string | null = null;

  try {
    [accountInfo, insights, media] = await Promise.all([
      getAccountInfo(),
      getAccountInsights(14),
      listMedia(15),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Insights por peça
  const piecesInsights: PieceWithInsights[] = [];
  if (media) {
    const tasks = media.map(async (m): Promise<PieceWithInsights> => ({
      media: m,
      insights: await getMediaInsights(m.id, m.media_product_type === "REELS"),
    }));
    const results = await Promise.all(tasks);
    piecesInsights.push(...results);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Métricas-rei orgânicas (não mídia paga) — IG Graph últimos 14 dias
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

      {accountInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {accountInfo.profile_picture_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={accountInfo.profile_picture_url}
                  alt={accountInfo.username}
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div>
                <CardTitle className="text-xl">@{accountInfo.username}</CardTitle>
                <CardDescription>
                  {accountInfo.followers_count.toLocaleString("pt-BR")} seguidores · {accountInfo.media_count} posts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Alcance total"
            value={insights.daily.reduce((s, d) => s + d.reach, 0).toLocaleString("pt-BR")}
            icon={TrendingUp}
            sub="14d"
          />
          <KpiCard
            label="Profile views"
            value={(insights.totals.profile_views || 0).toLocaleString("pt-BR")}
            icon={Eye}
            sub="14d"
          />
          <KpiCard
            label="Clicks no link"
            value={(insights.totals.website_clicks || 0).toLocaleString("pt-BR")}
            icon={MousePointerClick}
            sub="14d"
          />
          <KpiCard
            label="Accounts engaged"
            value={(insights.totals.accounts_engaged || 0).toLocaleString("pt-BR")}
            icon={Users}
            sub="14d"
          />
        </div>
      )}

      {insights && insights.daily.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alcance diário (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {insights.daily.map((d) => {
                const max = Math.max(...insights.daily.map((x) => x.reach));
                const pct = max > 0 ? (d.reach / max) * 100 : 0;
                return (
                  <div key={d.date} className="flex items-center gap-3 text-xs">
                    <div className="w-20 text-muted-foreground">
                      {new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </div>
                    <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right tabular-nums">
                      {d.reach.toLocaleString("pt-BR")}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {piecesInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas 15 peças — performance</CardTitle>
            <CardDescription>
              Ordenadas por share rate (sinal #1 do algoritmo IG 2026)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2">Data</th>
                    <th className="text-left py-2 pr-2">Tipo</th>
                    <th className="text-left py-2 pr-2">Caption</th>
                    <th className="text-right py-2 pr-2">Reach</th>
                    <th className="text-right py-2 pr-2">Views</th>
                    <th className="text-right py-2 pr-2">Watch</th>
                    <th className="text-right py-2 pr-2">Saves</th>
                    <th className="text-right py-2 pr-2">Shares</th>
                    <th className="text-right py-2 pr-2">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {piecesInsights
                    .map((p) => {
                      const share = (p.insights.shares ?? 0) / Math.max(p.insights.reach ?? 1, 1);
                      return { ...p, share };
                    })
                    .sort((a, b) => b.share - a.share)
                    .map(({ media: m, insights: i, share }) => (
                      <tr key={m.id} className="border-b hover:bg-accent/30">
                        <td className="py-2 pr-2 text-muted-foreground">
                          {m.timestamp.slice(0, 10)}
                        </td>
                        <td className="py-2 pr-2">
                          <Badge variant="outline" className="text-[10px]">
                            {m.media_product_type || m.media_type}
                          </Badge>
                        </td>
                        <td className="py-2 pr-2 max-w-xs truncate">
                          <a
                            href={m.permalink}
                            target="_blank"
                            className="hover:underline"
                            rel="noreferrer"
                          >
                            {(m.caption || "").slice(0, 60)}
                          </a>
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums">{i.reach ?? "-"}</td>
                        <td className="py-2 pr-2 text-right tabular-nums">{i.views ?? "-"}</td>
                        <td className="py-2 pr-2 text-right tabular-nums">
                          {i.ig_reels_avg_watch_time
                            ? `${(i.ig_reels_avg_watch_time / 1000).toFixed(1)}s`
                            : "-"}
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums">{i.saved ?? "-"}</td>
                        <td className="py-2 pr-2 text-right tabular-nums">{i.shares ?? "-"}</td>
                        <td className="py-2 pr-2 text-right tabular-nums font-medium">
                          {(share * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-2xl font-semibold mt-2">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
