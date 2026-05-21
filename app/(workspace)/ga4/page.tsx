import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getAccessToken } from "@/lib/ga4/oauth";
import {
  getPropertyId,
  getInstagramOrganicTraffic,
  getInfluencerTraffic,
  getTopCampaigns,
  getTrafficOverview,
} from "@/lib/ga4/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Plug } from "lucide-react";
import Link from "next/link";
import { SetupWizard, PropertySelector, DisconnectButton } from "./setup";

export const dynamic = "force-dynamic";

export default async function Ga4Page({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const admin = createSupabaseAdminClient();

  let isConnected = false;
  let propertyId: string | null = null;

  try {
    const token = await getAccessToken();
    isConnected = !!token;
    propertyId = await getPropertyId();
  } catch {
    isConnected = false;
  }

  // ============ Setup wizard ============
  if (!isConnected) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Google Analytics 4</h1>
          <p className="text-muted-foreground mt-1">
            Tráfego orgânico Instagram · influenciadores · campanhas UTM
          </p>
        </div>

        {sp.error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="pt-6 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="font-medium">Erro na conexão</p>
                <p className="text-xs text-muted-foreground mt-1">{sp.error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Conectar Google Analytics 4
            </CardTitle>
            <CardDescription>
              Autorize o app a ler dados do GA4 (escopo readonly).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SetupWizard />
            <div className="text-xs text-muted-foreground border-l-2 pl-3 space-y-2">
              <p className="font-medium text-foreground">⚠️ Antes de conectar:</p>
              <p>
                Adicione esta URL como <em>Authorized redirect URI</em> no OAuth Client do Google Cloud Console:
              </p>
              <code className="block bg-muted p-2 rounded text-[10px]">
                https://comms-king-app.vercel.app/api/ga4/callback
              </code>
              <p>
                Console → APIs &amp; Services → Credentials → OAuth Client (
                <code>n8n-2025-472522</code> /{" "}
                <code>897493677915-e9ctkroo5ba1b7eumh76ev5c3f5to630</code>
                ) → Edit → Authorized redirect URIs → Add
              </p>
              <p className="text-foreground">Sem isso, o callback vai falhar.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ Property selector (conectado, sem property) ============
  if (!propertyId) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Google Analytics 4</h1>
          <p className="text-muted-foreground mt-1">
            Conectado ✓ — escolha a property pra começar
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selecionar property</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertySelector />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ Dashboard completo ============
  let overview, igTraffic, influencers, campaigns;
  let dataError: string | null = null;

  try {
    [overview, igTraffic, influencers, campaigns] = await Promise.all([
      getTrafficOverview(30),
      getInstagramOrganicTraffic(30),
      getInfluencerTraffic(30),
      getTopCampaigns(30),
    ]);
  } catch (e) {
    dataError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Google Analytics 4</h1>
          <p className="text-muted-foreground mt-1">
            Últimos 30 dias · Property{" "}
            <code className="bg-muted px-1 rounded text-xs">{propertyId}</code>
          </p>
        </div>
        <DisconnectButton />
      </div>

      {dataError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="font-medium">Erro ao buscar dados GA4</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{dataError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tráfego orgânico Instagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📸 Tráfego orgânico — Instagram</CardTitle>
          <CardDescription>
            Sessions onde sessionSource contém &quot;instagram&quot; ou &quot;ig&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!igTraffic?.rows?.length ? (
            <p className="text-sm text-muted-foreground">Sem dados no período</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Stat
                  label="Sessions"
                  value={sum(igTraffic.rows, 0).toLocaleString("pt-BR")}
                />
                <Stat
                  label="Users"
                  value={sumDedup(igTraffic.rows, 1).toLocaleString("pt-BR")}
                />
                <Stat
                  label="New users"
                  value={sumDedup(igTraffic.rows, 2).toLocaleString("pt-BR")}
                />
                <Stat
                  label="Engaged sessions"
                  value={sum(igTraffic.rows, 3).toLocaleString("pt-BR")}
                />
              </div>
              <BarSeries rows={igTraffic.rows} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Influenciadores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🎤 Tráfego de influenciadores</CardTitle>
          <CardDescription>
            UTM medium contendo &quot;influencer/creator&quot;, campaign contendo &quot;influ&quot;, ou medium=referral
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!influencers?.rows?.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum tráfego de influenciador detectado.{" "}
              <span className="text-xs">
                Use UTM tags{" "}
                <code className="bg-muted px-1 rounded">utm_medium=influencer&amp;utm_source=&#123;handle&#125;</code> nos
                links que você der pros parceiros.
              </span>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2">Source</th>
                    <th className="text-left py-2 pr-2">Medium</th>
                    <th className="text-left py-2 pr-2">Campaign</th>
                    <th className="text-right py-2 pr-2">Sessions</th>
                    <th className="text-right py-2 pr-2">Users</th>
                    <th className="text-right py-2 pr-2">New</th>
                    <th className="text-right py-2 pr-2">Engaged</th>
                    <th className="text-right py-2 pr-2">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.rows.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-accent/30">
                      <td className="py-2 pr-2 font-medium">{r.dimensionValues[0].value}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{r.dimensionValues[1].value}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{r.dimensionValues[2].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[0].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[1].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[2].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[3].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums font-medium">{r.metricValues[4].value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top campanhas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🎯 Top campanhas UTM</CardTitle>
        </CardHeader>
        <CardContent>
          {!campaigns?.rows?.length ? (
            <p className="text-sm text-muted-foreground">Sem campanhas com UTM no período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2">Campanha</th>
                    <th className="text-left py-2 pr-2">Source / Medium</th>
                    <th className="text-right py-2 pr-2">Sessions</th>
                    <th className="text-right py-2 pr-2">Engaged</th>
                    <th className="text-right py-2 pr-2">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-b hover:bg-accent/30">
                      <td className="py-2 pr-2 font-medium">{r.dimensionValues[0].value}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{r.dimensionValues[1].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[0].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[1].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums font-medium">{r.metricValues[2].value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview geral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🌐 Overview — todos os canais</CardTitle>
          <CardDescription>Top 20 source/medium por sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {!overview?.rows?.length ? (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2">Source / Medium</th>
                    <th className="text-right py-2 pr-2">Sessions</th>
                    <th className="text-right py-2 pr-2">Users</th>
                    <th className="text-right py-2 pr-2">Engaged</th>
                    <th className="text-right py-2 pr-2">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-b hover:bg-accent/30">
                      <td className="py-2 pr-2 font-medium">{r.dimensionValues[0].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[0].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[1].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.metricValues[2].value}</td>
                      <td className="py-2 pr-2 text-right tabular-nums font-medium">{r.metricValues[4].value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function sum(rows: Array<{ metricValues: Array<{ value: string }> }>, idx: number): number {
  return rows.reduce((s, r) => s + Number(r.metricValues[idx]?.value || 0), 0);
}

function sumDedup(rows: Array<{ metricValues: Array<{ value: string }> }>, idx: number): number {
  // approximation: GA4 returns users per row (per dimension combo)
  // pra ter precisão, idealmente faríamos query sem dimension. Pra F1, somar.
  return sum(rows, idx);
}

function BarSeries({ rows }: { rows: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }> }) {
  // Agrupa por data
  const byDate = new Map<string, number>();
  for (const r of rows) {
    const date = r.dimensionValues[0].value;
    const sessions = Number(r.metricValues[0].value);
    byDate.set(date, (byDate.get(date) || 0) + sessions);
  }
  const series = Array.from(byDate.entries())
    .map(([date, sessions]) => ({ date, sessions }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const max = Math.max(...series.map((s) => s.sessions), 1);
  return (
    <div className="space-y-1 mt-2">
      {series.slice(-30).map((s) => (
        <div key={s.date} className="flex items-center gap-2 text-xs">
          <div className="w-16 text-muted-foreground">
            {`${s.date.slice(4, 6)}/${s.date.slice(6, 8)}`}
          </div>
          <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(s.sessions / max) * 100}%` }} />
          </div>
          <div className="w-12 text-right tabular-nums">{s.sessions}</div>
        </div>
      ))}
    </div>
  );
}
