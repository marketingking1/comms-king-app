/**
 * Promove um trend → cria zeitgeist piece no comms.zeitgeist_pieces.
 */

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const trendId = body.trendId;
  if (!trendId) return Response.json({ error: "trendId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: trend, error } = await supabase
    .from("trends")
    .select("*")
    .eq("id", trendId)
    .single();
  if (error || !trend) return Response.json({ error: "trend not found" }, { status: 404 });

  const { data: piece, error: insErr } = await supabase
    .from("zeitgeist_pieces")
    .insert({
      topic: trend.topic.slice(0, 500),
      source: trend.url || trend.source,
      window_type: "le48h",
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      king_angle: trend.king_angle,
      raw_markdown: `Origem: ${trend.source}\n\nTÓPICO: ${trend.topic}\n\nDESCRIÇÃO: ${trend.description || "—"}\n\nÂNGULO KING SUGERIDO:\n${trend.king_angle || "(refinar)"}\n\nURL fonte: ${trend.url || "—"}`,
      status: "new",
    })
    .select()
    .single();

  if (insErr) return Response.json({ error: insErr.message }, { status: 500 });

  return Response.json({ ok: true, zeitgeistId: piece.id });
}
