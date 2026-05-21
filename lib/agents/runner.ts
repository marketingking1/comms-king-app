import { streamText } from 'ai';
import { loadAgent } from './loader';
import { calculateCost, getAgentRoute, getModel, type AgentName } from '@/lib/ai/providers';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export type RunAgentInput = {
  agent: AgentName;
  userMessage: string;
  triggeredByUserId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

/**
 * Roda um agente em modo streaming.
 * Retorna StreamTextResult — caller decide se vai consumir como text ou response.
 */
export async function runAgentStreaming(input: RunAgentInput) {
  const spec = await loadAgent(input.agent);
  const route = getAgentRoute(input.agent);
  const model = getModel(input.agent);
  const startedAt = Date.now();

  const result = streamText({
    model,
    system: spec.systemPrompt,
    messages: [{ role: 'user', content: input.userMessage }],
    onFinish: async ({ usage, finishReason, text }) => {
      const inputTokens = usage?.inputTokens ?? 0;
      const outputTokens = usage?.outputTokens ?? 0;
      const cost = calculateCost(route.model, inputTokens, outputTokens);
      const duration = Date.now() - startedAt;

      try {
        const supabase = createSupabaseAdminClient();
        await supabase.from('agent_runs').insert({
          agent_name: input.agent,
          provider: route.provider,
          model: route.model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: cost,
          duration_ms: duration,
          status: finishReason === 'stop' ? 'success' : 'aborted',
          triggered_by: input.triggeredByUserId,
          related_entity_type: input.relatedEntityType,
          related_entity_id: input.relatedEntityId,
          raw_output: text,
        });
      } catch (e) {
        console.error('Failed to log agent_run:', e);
      }
    },
  });

  return result;
}
