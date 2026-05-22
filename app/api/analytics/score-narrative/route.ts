import { NextRequest } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const prompt = `Você é o analyst-io da King of Languages. Em 1 FRASE direta (máx 30 palavras), interprete esses números da semana e diga o que está acontecendo no orgânico do IG.

Score Semanal: ${body.score}/100 (delta ${body.delta}% vs semana anterior)
Reach 30d: ${body.reach}
Reach delta: ${body.reachDelta}%
Engagement médio: ${(body.avgEng * 100).toFixed(2)}%
Peças publicadas 30d: ${body.pieces}
Formato dominante: ${body.dominantFormat}
Profile→site CTR: ${(body.profileCTR * 100).toFixed(1)}%

Output: 1 frase, em PT-BR, tom direto-provocador. Sem clichê tipo "está crescendo bem". Aponte o que SUPREENDE nos dados. Se há algum sinal de alerta (eng caindo, reach travado, format wrong, etc), aponte. Senão, identifique a maior alavanca pra semana seguinte.`;

  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    prompt,
    maxOutputTokens: 200,
  });

  return Response.json({ narrative: text.trim() });
}
