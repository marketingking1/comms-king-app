import { streamText, type ModelMessage } from 'ai';
import { loadAgent } from './loader';
import { calculateCost, getAgentRoute, getModel, type AgentName } from '@/lib/ai/providers';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type RunAgentInput = {
  agent: AgentName;
  /** Single-turn (back-compat). Use `messages` for multi-turn. */
  userMessage?: string;
  /** Conversation history. Last entry must be role:'user'. */
  messages?: ChatTurn[];
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

  const conversation: ModelMessage[] =
    input.messages && input.messages.length > 0
      ? input.messages.map((m) => ({ role: m.role, content: m.content }))
      : [{ role: 'user', content: input.userMessage ?? '' }];

  // Log telemetry pré-call — útil pra debugar context overflow
  const systemChars = spec.systemPrompt.length;
  const userChars = conversation.reduce((a, m) => a + m.content.length, 0);
  console.info('[runner]', {
    agent: input.agent,
    model: route.model,
    systemChars,
    userChars,
    turns: conversation.length,
  });

  const result = streamText({
    model,
    system: spec.systemPrompt,
    messages: conversation,
    maxOutputTokens: route.maxTokens,
    onError: ({ error }) => {
      console.error('[runner] streamText error', {
        agent: input.agent,
        model: route.model,
        error: error instanceof Error ? error.message : String(error),
        systemChars,
        userChars,
      });
    },
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
