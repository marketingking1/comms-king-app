import { NextRequest } from "next/server";
import { runAgentStreaming } from "@/lib/agents/runner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { wrapUntrusted } from "@/lib/utils/sanitize-prompt";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z.object({
  analyticsContext: z.string().min(1).max(50000),
});

export async function POST(request: NextRequest) {
  // Auth
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

  // Rate limit: 1 / 5min / user (Sonnet ~$0.05/run)
  if (!checkRateLimit(`hypotheses:${user.id}`, 1, 300)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const prompt = `Você está rodando análise pós-publicação semanal sobre dados reais da conta @kingoflanguagesoficial.

DADOS COLETADOS (últimos 30 dias):

${wrapUntrusted("ANALYTICS_DATA", body.analyticsContext, 40000)}

Sua missão: GERAR 5-10 HIPÓTESES ACIONÁVEIS sobre o que está funcionando e o que não está, com base nestes dados.

Cada hipótese deve seguir o formato:

## Hipótese N — [Título conciso]
**Padrão observado:** [o número/observação que dispara a hipótese]
**Tese:** [interpretação narrativa]
**Validação proposta:** [qual experimento/peça testa essa tese no próximo sprint]
**Confiança:** [Alta / Média / Baixa baseado em volume de evidência]
**Quem age:** [million-strategist · storyteller-viral · scriptwriter · funnel-curator · zeitgeist-hunter]

Priorize hipóteses que:
1. Conectam padrão de DADOS → arco narrativo / Hero Brand / STEPPS
2. Detectem anti-padrões (peças com hook bom mas envolvimento ruim)
3. Identifiquem janelas de oportunidade (horários/dias/formatos não explorados)
4. Sugiram big ideas latentes (vilões/fissuras que ressoaram mais)
5. Conectem orgânico → busca por marca (search lift correlation)

NÃO faça hipótese genérica ("postar mais Reels"). Cada hipótese precisa ser ESPECÍFICA aos dados acima.

Use seu sequential thinking. Comece com diagnóstico narrativo de 1 parágrafo, depois liste as hipóteses.`;

  try {
    const result = await runAgentStreaming({
      agent: "comms-analyst-io",
      userMessage: prompt,
      triggeredByUserId: user.id,
      relatedEntityType: "analytics_snapshot",
    });
    return result.toTextStreamResponse();
  } catch (e) {
    console.error("[api/analytics/hypotheses]", e);
    return Response.json({ error: "internal" }, { status: 500 });
  }
}
