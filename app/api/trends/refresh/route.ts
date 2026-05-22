import { NextRequest } from "next/server";
import {
  getGoogleTrendsDaily,
  getTikTokTrending,
  getRedditTrending,
  getNewsTrending,
  getTwitterTrending,
  type RawTrend,
} from "@/lib/trends/sources";
import { classifyTrendsRelevance } from "@/lib/trends/classify";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const sources: string[] = body.sources || ["google_trends", "twitter", "tiktok", "reddit", "news"];

  const supabase = createSupabaseAdminClient();
  const startedAt = Date.now();
  const summary: Record<string, { count: number; error?: string }> = {};

  const fetchTasks: Array<Promise<RawTrend[]>> = [];
  if (sources.includes("google_trends")) fetchTasks.push(getGoogleTrendsDaily());
  if (sources.includes("news")) fetchTasks.push(getNewsTrending());
  // Apify sources (mais lentos)
  if (sources.includes("twitter")) fetchTasks.push(getTwitterTrending());
  if (sources.includes("tiktok")) fetchTasks.push(getTikTokTrending());
  if (sources.includes("reddit")) fetchTasks.push(getRedditTrending());

  const results = await Promise.allSettled(fetchTasks);

  // Combinar
  const allTrends: RawTrend[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allTrends.push(...r.value);
  }

  // Contar por source
  for (const t of allTrends) {
    if (!summary[t.source]) summary[t.source] = { count: 0 };
    summary[t.source].count++;
  }

  // Classificar relevância via Sonnet (em batches de 20 pra performance)
  const classifications: ReturnType<typeof classifyTrendsRelevance> extends Promise<infer U> ? U : never = [];
  const batchSize = 20;
  for (let i = 0; i < allTrends.length; i += batchSize) {
    const batch = allTrends.slice(i, i + batchSize);
    const batchResult = await classifyTrendsRelevance(batch);
    classifications.push(...batchResult);
  }

  // Inserir no Supabase (substituir os do dia)
  const today = new Date().toISOString().slice(0, 10);

  // Apaga trends do dia (re-fetch)
  const dayStart = new Date(today + "T00:00:00Z").toISOString();
  await supabase.from("trends").delete().gte("fetched_at", dayStart);

  // Inserir
  const rowsToInsert = allTrends.map((t, i) => ({
    source: t.source,
    topic: t.topic.slice(0, 500),
    description: t.description?.slice(0, 2000) || null,
    url: t.url || null,
    thumbnail_url: t.thumbnail_url || null,
    volume_score: t.volume_score || null,
    region: "BR",
    metadata: t.metadata || {},
    king_relevance: classifications[i]?.relevance || "unanalyzed",
    king_angle: classifications[i]?.king_angle || null,
    detected_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  }));

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("trends").insert(rowsToInsert);
    if (error) {
      return Response.json({ error: error.message, summary }, { status: 500 });
    }
  }

  return Response.json({
    ok: true,
    duration_ms: Date.now() - startedAt,
    total: allTrends.length,
    summary,
  });
}
