import { NextRequest } from "next/server";
import {
  getGoogleTrendsDaily,
  getTikTokTrending,
  getRedditTrending,
  getNewsTrending,
  getTwitterTrending,
  type RawTrend,
} from "@/lib/trends/sources";
import { classifyTrendsRelevance, type TrendClassification } from "@/lib/trends/classify";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

const ALLOWED_SOURCES = new Set(["google_trends", "twitter", "tiktok", "reddit", "news"]);

export async function POST(request: NextRequest) {
  // Auth
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

  // Rate limit: 1 refresh / 2min / user
  if (!checkRateLimit(`trends-refresh:${user.id}`, 1, 120)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const rawSources: unknown = body.sources;
  const sources: string[] = Array.isArray(rawSources)
    ? rawSources.filter((s): s is string => typeof s === "string" && ALLOWED_SOURCES.has(s))
    : ["google_trends", "twitter", "tiktok", "reddit", "news"];

  const supabase = createSupabaseAdminClient();
  const startedAt = Date.now();
  const summary: Record<string, { count: number; error?: string }> = {};

  type Task = { name: string; promise: Promise<RawTrend[]> };
  const fetchTasks: Task[] = [];
  if (sources.includes("google_trends")) fetchTasks.push({ name: "google_trends", promise: getGoogleTrendsDaily() });
  if (sources.includes("news")) fetchTasks.push({ name: "news", promise: getNewsTrending() });
  if (sources.includes("twitter")) fetchTasks.push({ name: "twitter", promise: getTwitterTrending() });
  if (sources.includes("tiktok")) fetchTasks.push({ name: "tiktok", promise: getTikTokTrending() });
  if (sources.includes("reddit")) fetchTasks.push({ name: "reddit", promise: getRedditTrending() });

  const results = await Promise.allSettled(fetchTasks.map((t) => t.promise));

  const allTrends: RawTrend[] = [];
  results.forEach((r, idx) => {
    const name = fetchTasks[idx].name;
    if (r.status === "fulfilled") {
      allTrends.push(...r.value);
      summary[name] = { count: r.value.length };
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`[trends/refresh] ${name} failed:`, msg);
      summary[name] = { count: 0, error: msg.slice(0, 200) };
    }
  });

  // Se TUDO falhou, retorna erro claro pro cliente
  if (allTrends.length === 0) {
    return Response.json(
      {
        error: "all sources failed",
        summary,
        hint: "Apify pode estar com quota esgotada ou actors lentos. Veja summary por fonte.",
      },
      { status: 502 },
    );
  }

  // Classificar relevância via Sonnet em batches de 20 — array global alinhado por posição
  const classifications: TrendClassification[] = [];
  const batchSize = 20;
  for (let i = 0; i < allTrends.length; i += batchSize) {
    const batch = allTrends.slice(i, i + batchSize);
    const batchResult = await classifyTrendsRelevance(batch);
    classifications.push(...batchResult);
  }

  // Re-fetch — apaga do dia + insere novos
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date(today + "T00:00:00Z").toISOString();
  await supabase.from("trends").delete().gte("fetched_at", dayStart);

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
      console.error("[trends/refresh] insert error:", error);
      return Response.json({ error: "insert failed", summary }, { status: 500 });
    }
  }

  return Response.json({
    ok: true,
    duration_ms: Date.now() - startedAt,
    total: allTrends.length,
    summary,
  });
}
