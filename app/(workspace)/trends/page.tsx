import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendsToolbar } from "./toolbar";
import { TrendCard } from "./trend-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  google_trends: "Google Trends",
  tiktok: "TikTok",
  reddit: "Reddit",
  news: "Notícias",
};

const SOURCE_EMOJI: Record<string, string> = {
  google_trends: "🔥",
  tiktok: "🎵",
  reddit: "🅁",
  news: "📰",
};

export default async function TrendsPage() {
  const supabase = await createSupabaseServerClient();

  // Trends das últimas 48h
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: trends } = await supabase
    .from("trends")
    .select("*")
    .gte("fetched_at", since)
    .order("king_relevance", { ascending: false })  // high → low
    .order("volume_score", { ascending: false, nullsFirst: false })
    .limit(200);

  const lastFetched = trends?.[0]?.fetched_at;

  // Agrupar por source
  const bySource = new Map<string, typeof trends>();
  for (const t of trends || []) {
    if (!bySource.has(t.source)) bySource.set(t.source, []);
    bySource.get(t.source)!.push(t);
  }

  const highRelevance = (trends || []).filter((t) => t.king_relevance === "high");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Trends · Assuntos do momento</h1>
          <p className="text-muted-foreground mt-1">
            O que tá viralizando no Brasil agora · atualização manual + cron diário (em breve)
          </p>
        </div>
        <TrendsToolbar lastFetched={lastFetched} />
      </div>

      {!trends?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground space-y-3">
            <p>Sem trends ainda. Clique em &quot;Atualizar agora&quot; pra buscar.</p>
            <p className="text-xs">
              ⚡ Google Trends + 📰 Notícias = rápido (~5s)<br />
              🎵 TikTok + 🅁 Reddit = lento (~2-3min via Apify)
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Banner: trends com alta relevância */}
          {highRelevance.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.04] to-transparent">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  ⭐ Alta relevância pra King ({highRelevance.length})
                </CardTitle>
                <CardDescription>
                  Trends que o squad pode aproveitar HOJE — clique &quot;Caçar pauta&quot; pra criar zeitgeist piece
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {highRelevance.slice(0, 12).map((t) => (
                  <TrendCard key={t.id} trend={t} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tabs por source */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Tudo ({trends.length})</TabsTrigger>
              {Array.from(bySource.entries()).map(([source, items]) => (
                <TabsTrigger key={source} value={source}>
                  {SOURCE_EMOJI[source]} {SOURCE_LABELS[source] || source} ({items?.length})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {trends.map((t) => (
                  <TrendCard key={t.id} trend={t} />
                ))}
              </div>
            </TabsContent>

            {Array.from(bySource.entries()).map(([source, items]) => (
              <TabsContent key={source} value={source}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(items || []).map((t) => (
                    <TrendCard key={t.id} trend={t} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}
