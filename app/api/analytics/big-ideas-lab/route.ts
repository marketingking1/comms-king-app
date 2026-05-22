import { NextRequest } from "next/server";
import { runAgentStreaming } from "@/lib/agents/runner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { wrapUntrusted } from "@/lib/utils/sanitize-prompt";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z.object({
  score: z.number().min(0).max(100).optional(),
  delta: z.number().optional(),
  topHooks: z.string().max(10000).optional(),
  topClusters: z.string().max(10000).optional(),
  saturatedClusters: z.string().max(10000).optional(),
  goldmine: z.string().max(10000).optional(),
  brandSearchLift: z.string().max(5000).optional(),
  anomalies: z.string().max(10000).optional(),
});

export async function POST(request: NextRequest) {
  // Auth
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

  // Rate limit Opus pesado: 1 / 10min / user
  if (!checkRateLimit(`big-ideas-lab:${user.id}`, 1, 600)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const prompt = `Você é o comms-million-strategist. Gerar **3 Big Ideas $1M** cruzando os dados abaixo (todos da última semana do orgânico KoL).

============ EVIDÊNCIAS COLETADAS ============

SCORE SEMANAL: ${Number(body.score ?? 0)}/100 (delta ${Number(body.delta ?? 0)}%)

TOP HOOKS (peças que mais converteram):
${wrapUntrusted("HOOKS", body.topHooks || "—", 5000)}

CLUSTERS TEMÁTICOS DE MELHOR PERFORMANCE:
${wrapUntrusted("TOP_CLUSTERS", body.topClusters || "—", 5000)}

CLUSTERS SATURADOS (baixa performance, alto volume):
${wrapUntrusted("SATURATED_CLUSTERS", body.saturatedClusters || "—", 5000)}

QUADRANTE GOLDMINE (alto reach + alto save):
${wrapUntrusted("GOLDMINE", body.goldmine || "—", 5000)}

CORRELAÇÃO ORG → BUSCA POR MARCA (Pearson lag 1-3 dias):
${wrapUntrusted("BRAND_SEARCH", body.brandSearchLift || "—", 2000)}

ANOMALIAS DA SEMANA:
${wrapUntrusted("ANOMALIES", body.anomalies || "—", 5000)}

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
      triggeredByUserId: user.id,
      relatedEntityType: "analytics_snapshot",
    });
    return result.toTextStreamResponse();
  } catch (e) {
    console.error("[api/analytics/big-ideas-lab]", e);
    return Response.json({ error: "internal" }, { status: 500 });
  }
}
