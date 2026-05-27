import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { refreshViralVideos } from "@/lib/viral/refresh";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Auth
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

  // Rate limit: 1 refresh / 2min / user
  if (!checkRateLimit(`viral-refresh:${user.id}`, 1, 120)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  // Opcional: hashtags customizadas no body (default: HASHTAGS_VIRAL_BR)
  const body = await request.json().catch(() => ({}));
  const customHashtags: string[] | undefined = Array.isArray(body?.hashtags)
    ? body.hashtags.filter((h: unknown): h is string => typeof h === "string" && /^[a-zA-Z0-9_]{2,30}$/.test(h))
    : undefined;
  const resultsPerHashtag: number = Number.isFinite(body?.resultsPerHashtag)
    ? Math.max(10, Math.min(100, body.resultsPerHashtag))
    : 30;

  const result = await refreshViralVideos({
    hashtags: customHashtags,
    resultsPerHashtag,
  });

  if (!result.ok) {
    console.error("[viral/refresh]", result);
    const status = result.error === "apify failed" ? 502 : 500;
    return Response.json(result, { status });
  }

  return Response.json(result);
}
