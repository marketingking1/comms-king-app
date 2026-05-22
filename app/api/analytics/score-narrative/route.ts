import { NextRequest } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  score: z.number().min(0).max(100),
  delta: z.number(),
  reach: z.number().min(0),
  reachDelta: z.number(),
  avgEng: z.number().min(0).max(1),
  pieces: z.number().int().min(0),
  dominantFormat: z.string().max(50),
  profileCTR: z.number().min(0).max(1),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

  if (!checkRateLimit(`score-narrative:${user.id}`, 5, 60)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const prompt = `Você é o analyst-io da King of Languages. Em 1 FRASE direta (máx 30 palavras), interprete esses números da semana e diga o que está acontecendo no orgânico do IG.

Score Semanal: ${body.score}/100 (delta ${body.delta}% vs semana anterior)
Reach 30d: ${body.reach}
Reach delta: ${body.reachDelta}%
Engagement médio: ${(body.avgEng * 100).toFixed(2)}%
Peças publicadas 30d: ${body.pieces}
Formato dominante: ${body.dominantFormat.replace(/[<>]/g, "")}
Profile→site CTR: ${(body.profileCTR * 100).toFixed(1)}%

Output: 1 frase, em PT-BR, tom direto-provocador. Sem clichê tipo "está crescendo bem". Aponte o que SUPREENDE nos dados. Se há algum sinal de alerta (eng caindo, reach travado, format wrong, etc), aponte. Senão, identifique a maior alavanca pra semana seguinte.`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      prompt,
      maxOutputTokens: 200,
    });
    return Response.json({ narrative: text.trim() });
  } catch (e) {
    console.error("[api/analytics/score-narrative]", e);
    return Response.json({ error: "internal" }, { status: 500 });
  }
}
