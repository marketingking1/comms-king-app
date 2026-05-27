/**
 * Cron endpoint disparado pelo Vercel Cron diariamente às 08:00 BRT (11:00 UTC).
 *
 * Auth: Vercel injeta `Authorization: Bearer ${CRON_SECRET}` automaticamente
 * quando a env var CRON_SECRET está setada no projeto Vercel.
 *
 * Schedule definido em vercel.json → "0 11 * * *"
 */

import { NextRequest } from "next/server";
import { refreshViralVideos } from "@/lib/viral/refresh";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Em prod, exige bearer. Em dev (sem secret), libera pra testar local manualmente.
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await refreshViralVideos();

  if (!result.ok) {
    console.error("[viral/cron]", result);
    return Response.json(result, { status: 500 });
  }

  console.log("[viral/cron] success", {
    total: result.total,
    duration_ms: result.duration_ms,
  });
  return Response.json(result);
}
