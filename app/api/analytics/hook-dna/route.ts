import { NextRequest } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const HookSchema = z.object({
  classifications: z.array(
    z.object({
      pieceIndex: z.number(),
      hook_type: z.enum([
        "curiosity_gap",
        "contrarian",
        "stake_reveal",
        "question_direct",
        "number_promise",
        "pattern_interrupt",
        "story_in_media_res",
        "declaration",
        "bater_no_inimigo",
        "unknown",
      ]),
      pov: z.enum(["aluno", "professor", "outsider", "narrator", "marca"]),
      first_useful_info_at_word: z.number(),
      tension_promised: z.string().describe("uma frase sobre o que a peça promete revelar"),
      strength: z.enum(["forte", "médio", "fraco"]),
    }),
  ),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pieces: Array<{ caption: string; reach: number; share_rate: number }> = body.pieces;

  if (!pieces || pieces.length === 0) {
    return Response.json({ error: "no pieces" }, { status: 400 });
  }

  const piecesText = pieces.slice(0, 20).map((p, i) =>
    `[${i}] (reach ${p.reach}, share ${(p.share_rate * 100).toFixed(2)}%) "${p.caption.slice(0, 200)}"`,
  ).join("\n\n");

  const prompt = `Você analisa hooks de Reels/Carrossel do Instagram da King of Languages (escola de inglês p/ profissionais).

Para cada peça abaixo, classifique:
1. hook_type: padrão dominante na PRIMEIRA frase
2. pov: ponto de vista narrativo
3. first_useful_info_at_word: em qual palavra aparece a primeira informação útil/concreta
4. tension_promised: o que a primeira frase promete revelar
5. strength: avalia se o hook prende ou é fraco

Peças:

${piecesText}

Responda em JSON estruturado.`;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      prompt,
      schema: HookSchema,
    });
    return Response.json(object);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
