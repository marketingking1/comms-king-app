import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listLeads,
  listPipelines,
  listUsers,
  KOMMO_PIPELINES,
  KOMMO_TAGS,
  STATUS_WON,
  STATUS_LOST,
} from "@/lib/kommo/client";
import {
  classifyLeadSource,
  calcFunnelStats,
  statsByStatus,
  statsBySeller,
  dailyLeadsTimeline,
  calcCycleTime,
  pearson,
  type LeadSource,
} from "@/lib/sales/funnel";
import { getAccountInsights, listMedia, getMediaInsights } from "@/lib/instagram/graph";
import { buildDailyPostsSeries } from "@/lib/instagram/analytics-advanced";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Users, Target, Clock, Instagram } from "lucide-react";

export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function SalesPage() {
  // ============ FETCH PARALELO ============
  let kommoErr: string | null = null;
  let igErr: string | null = null;

  const since = Math.floor(Date.now() / 1000) - DAYS * 86400;
  const sincePrev = since - DAYS * 86400;

  // IG orgânico = união das 2 tags + leads no pipeline Social Selling
  // (algumas pessoas marcam só com tag, outras só com pipeline)
  const [
    pipelines,
    users,
    leadsTagOrganico,
    leadsTagSocialSelling,
    leadsPipelineSocialSelling,
    leadsTagOrganicoPrev,
    leadsTagSocialSellingPrev,
    leadsCurrent,
    igInsights,
    igMedia,
  ] = await Promise.all([
    listPipelines().catch((e) => { kommoErr = String(e); return []; }),
    listUsers().catch(() => []),
    listLeads({ tagId: KOMMO_TAGS.organico_insta, createdAfter: since, maxItems: 2000 })
      .catch((e) => { kommoErr = String(e); return []; }),
    listLeads({ tagId: KOMMO_TAGS.social_selling, createdAfter: since, maxItems: 2000 })
      .catch(() => []),
    listLeads({ pipelineId: KOMMO_PIPELINES.social_selling, createdAfter: since, maxItems: 2000 })
      .catch(() => []),
    listLeads({ tagId: KOMMO_TAGS.organico_insta, createdAfter: sincePrev, maxItems: 2000 })
      .catch(() => [])
      .then((all) => all.filter((l) => l.created_at < since)),
    listLeads({ tagId: KOMMO_TAGS.social_selling, createdAfter: sincePrev, maxItems: 2000 })
      .catch(() => [])
      .then((all) => all.filter((l) => l.created_at < since)),
    listLeads({ createdAfter: since, maxItems: 1500 }).catch(() => []),
    getAccountInsights(DAYS).catch((e) => { igErr = String(e); return undefined; }),
    listMedia(60).catch(() => []),
  ]);

  // Union dedup por lead ID
  function unionByLeadId<T extends { id: number }>(...arrays: T[][]): T[] {
    const map = new Map<number, T>();
    for (const arr of arrays) for (const l of arr) map.set(l.id, l);
    return Array.from(map.values());
  }
  const igOrganic = unionByLeadId(leadsTagOrganico, leadsTagSocialSelling, leadsPipelineSocialSelling);
  const igOrganicPrev = unionByLeadId(leadsTagOrganicoPrev, leadsTagSocialSellingPrev);

  // Source breakdown geral (heurístico)
  const classified = leadsCurrent.map((l) => ({ lead: l, source: classifyLeadSource(l) }));

  // Stats principais
  const stats = calcFunnelStats(igOrganic);
  const statsPrev = calcFunnelStats(igOrganicPrev);
  const cycleTime = calcCycleTime(igOrganic);

  // Pipeline Social Selling — analise detalhada
  const socialSellingPipeline = pipelines.find((p) => p.id === KOMMO_PIPELINES.social_selling);
  const socialSellingLeads = igOrganic.filter((l) => l.pipeline_id === KOMMO_PIPELINES.social_selling);
  const statusBuckets = socialSellingPipeline
    ? statsByStatus(socialSellingLeads, socialSellingPipeline)
    : [];

  // Sellers
  const sellers = statsBySeller(igOrganic, users);

  // Timeline diária
  const dailyTimeline = dailyLeadsTimeline(igOrganic, DAYS);

  // IG website clicks daily — vou aproximar usando totais (não temos por dia exato)
  const igClicksTotal = igInsights?.totals.website_clicks || 0;
  const igProfileViewsTotal = igInsights?.totals.profile_views || 0;

  // Correlação clicks IG (por peça do dia) × leads IG no dia
  // Aproximação: usar daily posts series como proxy de "presença IG"
  const dailyPosts = buildDailyPostsSeries(
    (await Promise.all(
      igMedia.map(async (m) => ({
        media: m,
        insights: await getMediaInsights(m.id, m.media_product_type === "REELS").catch(() => ({})),
      })),
    )),
    DAYS,
  );
  const corr = pearson(
    dailyPosts.map((d) => d.posts),
    dailyTimeline.map((d) => d.total),
  );

  // Source breakdown geral
  const sourceBreakdown = new Map<LeadSource, { count: number; revenue: number; won: number }>();
  for (const c of classified) {
    const cur = sourceBreakdown.get(c.source) || { count: 0, revenue: 0, won: 0 };
    cur.count++;
    if (c.lead.status_id === STATUS_WON) {
      cur.won++;
      cur.revenue += c.lead.price || 0;
    }
    sourceBreakdown.set(c.source, cur);
  }

  // Delta vs período anterior
  function pct(cur: number, prev: number) {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Vendas — Funil Orgânico Instagram</h1>
        <p className="text-muted-foreground mt-1">
          IG profile → bio click → lead Kommo → venda · últimos {DAYS} dias
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Critério: leads com tag <strong>&quot;Orgânico Insta&quot;</strong> OU tag <strong>&quot;Social Selling&quot;</strong> OU pipeline Social Selling — união de todos os pipelines
        </p>
      </div>

      {(kommoErr || igErr) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 space-y-1 text-sm">
            {kommoErr && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <span>Kommo: <code className="text-xs">{kommoErr}</code></span>
              </div>
            )}
            {igErr && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <span>IG: <code className="text-xs">{igErr}</code></span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============ FUNIL VISUAL TOP-DOWN ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil orgânico end-to-end (30d)</CardTitle>
          <CardDescription>
            Taxa de conversão entre cada etapa — onde está o gargalo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelVisualization
            stages={[
              {
                label: "IG Profile Views",
                value: igProfileViewsTotal,
                icon: <Instagram className="h-4 w-4" />,
                description: "Visitas ao perfil @kingoflanguagesoficial",
              },
              {
                label: "IG Website Clicks",
                value: igClicksTotal,
                icon: <Target className="h-4 w-4" />,
                description: "Cliques no link da bio",
              },
              {
                label: "Leads orgânicos Kommo",
                value: stats.total,
                icon: <Users className="h-4 w-4" />,
                description: "Lead criado no Kommo com source orgânico IG",
              },
              {
                label: "Em andamento",
                value: stats.open,
                icon: <Clock className="h-4 w-4" />,
                description: "Leads ativos no pipeline",
              },
              {
                label: "Vendas (won)",
                value: stats.won,
                icon: <DollarSign className="h-4 w-4" />,
                description: "Leads que fecharam contrato",
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* ============ KPIs COMPARATIVOS ============ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Leads IG orgânico"
          value={stats.total.toLocaleString("pt-BR")}
          delta={pct(stats.total, statsPrev.total)}
        />
        <Kpi
          label="Vendas (won)"
          value={stats.won.toLocaleString("pt-BR")}
          delta={pct(stats.won, statsPrev.won)}
        />
        <Kpi
          label="Receita"
          value={`R$ ${stats.totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
          delta={pct(stats.totalRevenue, statsPrev.totalRevenue)}
        />
        <Kpi
          label="Conversão"
          value={`${(stats.conversionRate * 100).toFixed(1)}%`}
          delta={
            statsPrev.conversionRate > 0
              ? ((stats.conversionRate - statsPrev.conversionRate) / statsPrev.conversionRate) * 100
              : 0
          }
        />
      </div>

      {/* ============ ATIVIDADE DIÁRIA ============ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">Leads orgânicos por dia</CardTitle>
              <CardDescription>
                Total (cinza) e won (verde) — correlação com posts IG diários: <strong>{corr.toFixed(2)}</strong>
              </CardDescription>
            </div>
            <Badge variant={Math.abs(corr) > 0.3 ? "default" : "outline"}>
              Pearson r={corr.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DailyChart timeline={dailyTimeline} />
        </CardContent>
      </Card>

      {/* ============ DISTRIBUIÇÃO POR STATUS ============ */}
      {statusBuckets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição no funil Social Selling</CardTitle>
            <CardDescription>Onde estão parados os leads — gargalo visível</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left py-2 pr-2">Status</th>
                  <th className="text-right py-2 pr-2">Leads</th>
                  <th className="text-right py-2 pr-2">Valor R$</th>
                  <th className="text-right py-2 pr-2">Tempo médio (dias)</th>
                  <th className="text-left py-2 pl-3">Visual</th>
                </tr>
              </thead>
              <tbody>
                {statusBuckets.map((b) => {
                  const maxCount = Math.max(...statusBuckets.map((x) => x.count), 1);
                  return (
                    <tr key={b.statusId} className="border-b">
                      <td className="py-2 pr-2 font-medium">{b.statusName}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{b.count}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {b.totalValue > 0 ? b.totalValue.toLocaleString("pt-BR") : "—"}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {b.avgAgeDays.toFixed(1)}
                      </td>
                      <td className="py-2 pl-3 w-1/3">
                        <div className="h-2 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(b.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ============ PERFORMANCE POR VENDEDOR ============ */}
      {sellers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance por vendedor</CardTitle>
            <CardDescription>Quem fecha mais leads IG orgânico</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left py-2 pr-2">Vendedor</th>
                  <th className="text-right py-2 pr-2">Leads</th>
                  <th className="text-right py-2 pr-2">Won</th>
                  <th className="text-right py-2 pr-2">Lost</th>
                  <th className="text-right py-2 pr-2">Conv %</th>
                  <th className="text-right py-2 pr-2">Receita</th>
                </tr>
              </thead>
              <tbody>
                {sellers.slice(0, 15).map((s) => (
                  <tr key={s.userId} className="border-b">
                    <td className="py-2 pr-2 font-medium">{s.userName}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{s.leads}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-green-600 dark:text-green-400">
                      {s.won}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums text-destructive">{s.lost}</td>
                    <td className="py-2 pr-2 text-right tabular-nums font-medium">
                      {(s.conversionRate * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      R$ {s.revenue.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ============ TEMPO DE CICLO ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tempo de ciclo</CardTitle>
          <CardDescription>Quantos dias do lead à decisão</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border rounded-md p-4">
            <p className="text-xs text-muted-foreground">Lead → Won (média)</p>
            <p className="text-2xl font-semibold mt-1">{cycleTime.avgDaysToWon.toFixed(1)}d</p>
          </div>
          <div className="border rounded-md p-4">
            <p className="text-xs text-muted-foreground">Lead → Won (mediana)</p>
            <p className="text-2xl font-semibold mt-1">{cycleTime.medianDaysToWon.toFixed(1)}d</p>
          </div>
          <div className="border rounded-md p-4">
            <p className="text-xs text-muted-foreground">Lead → Lost (média)</p>
            <p className="text-2xl font-semibold mt-1">{cycleTime.avgDaysToLost.toFixed(1)}d</p>
          </div>
        </CardContent>
      </Card>

      {/* ============ FONTES — CONTEXTO ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source breakdown — todos canais</CardTitle>
          <CardDescription>
            Comparativo: IG orgânico vs outras origens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="text-left py-2 pr-2">Source</th>
                <th className="text-right py-2 pr-2">Leads</th>
                <th className="text-right py-2 pr-2">Won</th>
                <th className="text-right py-2 pr-2">Receita</th>
                <th className="text-right py-2 pr-2">Conv %</th>
                <th className="text-right py-2 pr-2">Tkt médio</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(sourceBreakdown.entries())
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([src, s]) => (
                  <tr
                    key={src}
                    className={`border-b ${
                      src === "instagram_organic" ? "bg-primary/5 font-medium" : ""
                    }`}
                  >
                    <td className="py-2 pr-2 capitalize">{src.replace(/_/g, " ")}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{s.count}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{s.won}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      R$ {s.revenue.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {s.count > 0 ? ((s.won / s.count) * 100).toFixed(1) : "0"}%
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      R$ {s.won > 0 ? (s.revenue / s.won).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ============ LEADS IG ORGÂNICO RECENTES ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads IG orgânico — recentes</CardTitle>
          <CardDescription>Top 30 por data de criação</CardDescription>
        </CardHeader>
        <CardContent>
          {igOrganic.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lead orgânico identificado no período</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left py-2 pr-2">Criado</th>
                  <th className="text-left py-2 pr-2">Nome</th>
                  <th className="text-right py-2 pr-2">Valor</th>
                  <th className="text-left py-2 pr-2">Pipeline</th>
                  <th className="text-left py-2 pr-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...igOrganic]
                  .sort((a, b) => b.created_at - a.created_at)
                  .slice(0, 30)
                  .map((l) => {
                    const pipe = pipelines.find((p) => p.id === l.pipeline_id);
                    const status = pipe?._embedded.statuses.find((s) => s.id === l.status_id);
                    const isWon = l.status_id === STATUS_WON;
                    const isLost = l.status_id === STATUS_LOST;
                    return (
                      <tr key={l.id} className="border-b">
                        <td className="py-2 pr-2 text-muted-foreground">
                          {new Date(l.created_at * 1000).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-2 pr-2">{l.name || `Lead ${l.id}`}</td>
                        <td className="py-2 pr-2 text-right tabular-nums">
                          {l.price > 0 ? `R$ ${l.price.toLocaleString("pt-BR")}` : "—"}
                        </td>
                        <td className="py-2 pr-2 text-muted-foreground">{pipe?.name || l.pipeline_id}</td>
                        <td className="py-2 pr-2">
                          <Badge
                            variant={isWon ? "default" : isLost ? "destructive" : "secondary"}
                            className="text-[10px]"
                          >
                            {status?.name || l.status_id}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ COMPONENTES ============

function Kpi({ label, value, delta }: { label: string; value: string; delta: number }) {
  const isUp = delta >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums mt-1">{value}</p>
        <p className={`text-[10px] flex items-center gap-1 mt-1 ${isUp ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
          <Icon className="h-3 w-3" />
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}% vs anterior
        </p>
      </CardContent>
    </Card>
  );
}

function FunnelVisualization({
  stages,
}: {
  stages: Array<{ label: string; value: number; icon: React.ReactNode; description: string }>;
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const widthPct = max > 0 ? (s.value / max) * 100 : 0;
        const prev = i > 0 ? stages[i - 1].value : null;
        const conversionRate = prev && prev > 0 ? (s.value / prev) * 100 : null;
        return (
          <div key={s.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{s.icon}</span>
                <span className="font-medium">{s.label}</span>
                {conversionRate !== null && (
                  <Badge
                    variant={conversionRate > 30 ? "default" : conversionRate > 10 ? "secondary" : "destructive"}
                    className="text-[10px]"
                  >
                    {conversionRate.toFixed(1)}% conversão
                  </Badge>
                )}
              </div>
              <span className="tabular-nums font-semibold">{s.value.toLocaleString("pt-BR")}</span>
            </div>
            <div className="h-6 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/60 flex items-center px-2 text-[10px] text-primary-foreground"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground ml-6">{s.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function DailyChart({ timeline }: { timeline: Array<{ date: string; total: number; won: number }> }) {
  const max = Math.max(...timeline.map((d) => d.total), 1);
  const W = 720;
  const H = 200;
  const PAD = 30;

  function x(i: number) {
    return PAD + (i / Math.max(timeline.length - 1, 1)) * (W - 2 * PAD);
  }
  function y(v: number) {
    return H - PAD - (v / max) * (H - 2 * PAD);
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-4xl">
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.3" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.3" />

        {timeline.map((d, i) => {
          const xc = x(i);
          const w = Math.max(((W - 2 * PAD) / timeline.length) * 0.7, 2);
          const ytotal = y(d.total);
          const ywon = y(d.won);
          return (
            <g key={d.date}>
              <rect
                x={xc - w / 2}
                y={ytotal}
                width={w}
                height={H - PAD - ytotal}
                fill="currentColor"
                fillOpacity={0.25}
              />
              <rect
                x={xc - w / 2}
                y={ywon}
                width={w}
                height={H - PAD - ywon}
                fill="rgb(34,197,94)"
                fillOpacity={0.8}
              />
            </g>
          );
        })}

        <text x={PAD - 6} y={PAD + 4} textAnchor="end" className="text-[9px] fill-muted-foreground">
          {max}
        </text>
        <text x={PAD - 6} y={H - PAD} textAnchor="end" className="text-[9px] fill-muted-foreground">
          0
        </text>
      </svg>
    </div>
  );
}
