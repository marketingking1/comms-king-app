import { NextRequest } from "next/server";
import { runAgentStreaming } from "@/lib/agents/runner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = await request.json();

  const prompt = `Você é o comms-million-strategist. Gerar **3 Big Ideas $1M** cruzando os dados abaixo (todos da última semana do orgânico KoL).

============ EVIDÊNCIAS COLETADAS ============

SCORE SEMANAL: ${body.score}/100 (delta ${body.delta}%)

TOP HOOKS (peças que mais converteram):
${body.topHooks || "—"}

CLUSTERS TEMÁTICOS DE MELHOR PERFORMANCE:
${body.topClusters || "—"}

CLUSTERS SATURADOS (baixa performance, alto volume):
${body.saturatedClusters || "—"}

QUADRANTE GOLDMINE (alto reach + alto save):
${body.goldmine || "—"}

CORRELAÇÃO ORG → BUSCA POR MARCA (Pearson lag 1-3 dias):
${body.brandSearchLift || "—"}

ANOMALIAS DA SEMANA:
${body.anomalies || "—"}

============ MISSÃO ============

Gere 3 Big Ideas $1M. Cada uma DEVE:
1. Conectar 2+ evidências acima (cite especificamente)
2. Ter título provocativo (1 frase ≤ 12 palavras)
3. Definir VILÃO declarado
4. Definir FISSURA SOCIAL tocada
5. Sugerir formato + hook + ponto de virada
6. Justificativa de "por que vale $1M"

Formato de cada Big Idea:

## Big Idea N — [TÍTULO]
**Evidências:** [bullets citando seções: "Top hook X + Goldmine Y"]
**Tese:** [1 frase central]
**Vilão:** [específico]
**Fissura Social:** [específica do Marcelo executivo travado]
**Formato sugerido:** [Reels Xs / Carrossel N slides / etc]
**Hook proposto:** [primeira frase publicável]
**Ponto de virada:** [Reframe / Reveal / Inversão / CTA emocional]
**Por que $1M:** [magnitude esperada de share + brand search lift]
**Quem executa:** [storyteller-viral → scriptwriter → edit-director]

NÃO genérico. NÃO "fazer mais Reels". Cada Big Idea precisa ser UMA TESE específica que essas 3 evidências sustentam.`;

  try {
    const result = await runAgentStreaming({
      agent: "comms-million-strategist",
      userMessage: prompt,
      relatedEntityType: "analytics_snapshot",
    });
    return result.toTextStreamResponse();
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
