/**
 * Classifica trends por relevância pra King of Languages.
 */

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const ClassifySchema = z.object({
  classifications: z.array(
    z.object({
      index: z.number(),
      relevance: z.enum(["high", "medium", "low"]),
      king_angle: z.string().describe("ângulo King possível (até 200 chars) ou 'sem ângulo' se irrelevante"),
    }),
  ),
});

export type TrendClassification = {
  relevance: "high" | "medium" | "low";
  king_angle: string;
};

export async function classifyTrendsRelevance(
  trends: Array<{ topic: string; description?: string; source: string }>,
): Promise<TrendClassification[]> {
  if (trends.length === 0) return [];

  const list = trends
    .map((t, i) => `[${i}] (${t.source}) ${t.topic}${t.description ? ` — ${t.description.slice(0, 150)}` : ""}`)
    .join("\n");

  const prompt = `Você é o zeitgeist-hunter da King of Languages (escola de inglês p/ profissionais 28-50 anos · vilão: escola tradicional / método de gramática / "tem que morar fora").

Para cada trend abaixo, classifique:
1. **relevance**: a King consegue criar uma peça orgânica com ângulo único e Hero Brand sobre isso?
   - high: ressoa direto com o público (profissional, carreira, inglês, IA no trabalho, vagas, idioma, viagem)
   - medium: dá pra forçar ângulo se for cuidadoso
   - low: irrelevante OU compliance arriscado (política/religião/tragédia)
2. **king_angle**: se relevance > low, dê UM ângulo contrário/profundo (não óbvio) que SÓ a King poderia dar. Frase concisa. Se low, "sem ângulo".

Trends:

${list}

Retorne classificação pra TODOS os trends.`;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      prompt,
      schema: ClassifySchema,
    });

    const results: TrendClassification[] = new Array(trends.length).fill({ relevance: "low", king_angle: "sem ângulo" });
    for (const c of object.classifications) {
      if (c.index >= 0 && c.index < trends.length) {
        results[c.index] = {
          relevance: c.relevance,
          king_angle: c.king_angle.slice(0, 500),
        };
      }
    }
    return results;
  } catch (e) {
    console.error("[classify]", e);
    return trends.map(() => ({ relevance: "low" as const, king_angle: "" }));
  }
}
