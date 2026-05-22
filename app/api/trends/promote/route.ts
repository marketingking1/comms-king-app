/**
 * Promove um trend → cria zeitgeist piece no comms.zeitgeist_pieces.
 */

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  trendId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

  if (!checkRateLimit(`trends-promote:${user.id}`, 20, 60)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { data: trend, error } = await supabase
    .from("trends")
    .select("*")
    .eq("id", body.trendId)
    .single();
  if (error || !trend) return Response.json({ error: "trend not found" }, { status: 404 });

  const { data: piece, error: insErr } = await supabase
    .from("zeitgeist_pieces")
    .insert({
      topic: String(trend.topic).slice(0, 500),
      source: trend.url || trend.source,
      window_type: "le48h",
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      king_angle: trend.king_angle,
      raw_markdown: `Origem: ${trend.source}\n\nTÓPICO: ${trend.topic}\n\nDESCRIÇÃO: ${trend.description || "—"}\n\nÂNGULO KING SUGERIDO:\n${trend.king_angle || "(refinar)"}\n\nURL fonte: ${trend.url || "—"}`,
      status: "new",
    })
    .select()
    .single();

  if (insErr) {
    console.error("[api/trends/promote]", insErr);
    return Response.json({ error: "insert failed" }, { status: 500 });
  }

  return Response.json({ ok: true, zeitgeistId: piece.id });
}
