/**
 * Lógica de refresh dos virais — compartilhada entre:
 *   - POST /api/viral/refresh (disparada por usuário logado)
 *   - GET  /api/viral/cron    (disparada pelo Vercel Cron com bearer)
 */

import { getInstagramViralsBR } from "@/lib/viral/sources";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type RefreshResult = {
  ok: boolean;
  duration_ms: number;
  total: number;
  error?: string;
  message?: string;
  hint?: string;
};

export async function refreshViralVideos(opts?: {
  hashtags?: string[];
  resultsPerHashtag?: number;
}): Promise<RefreshResult> {
  const startedAt = Date.now();

  let viralsToInsert: Awaited<ReturnType<typeof getInstagramViralsBR>>;
  try {
    viralsToInsert = await getInstagramViralsBR(opts);
  } catch (e) {
    return {
      ok: false,
      duration_ms: Date.now() - startedAt,
      total: 0,
      error: "apify failed",
      hint: "Verifica APIFY_TOKEN, quota e status do actor apify/instagram-hashtag-scraper",
      message: e instanceof Error ? e.message.slice(0, 300) : String(e),
    };
  }

  if (viralsToInsert.length === 0) {
    return {
      ok: true,
      duration_ms: Date.now() - startedAt,
      total: 0,
      message: "nenhum viral encontrado na janela 48h",
    };
  }

  const supabase = createSupabaseAdminClient();

  const rows = viralsToInsert.map((v) => ({
    ...v,
    fetched_at: new Date().toISOString(),
  }));

  // Upsert: preserva status (commented/skipped) porque a coluna não está no payload.
  const { error } = await supabase
    .from("viral_videos")
    .upsert(rows, {
      onConflict: "platform,external_id",
      ignoreDuplicates: false,
    });

  if (error) {
    return {
      ok: false,
      duration_ms: Date.now() - startedAt,
      total: viralsToInsert.length,
      error: "insert failed",
      message: error.message,
    };
  }

  return {
    ok: true,
    duration_ms: Date.now() - startedAt,
    total: viralsToInsert.length,
  };
}
