import { NextRequest } from 'next/server';
import { runAgentStreaming } from '@/lib/agents/runner';
import { listAgents } from '@/lib/agents/loader';
import type { AgentName } from '@/lib/ai/providers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5min

// Limite de 200k chars/mensagem — briefs com transcript podem passar de 50k.
// 200k chars ≈ 50k tokens (margem ampla dentro do contexto Opus 4.7 1M).
const MAX_CHARS = 200_000;

const ChatTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(MAX_CHARS),
});

const BodySchema = z
  .object({
    // Back-compat: single-turn
    message: z.string().min(1).max(MAX_CHARS).optional(),
    // Multi-turn chat (last item deve ser role:'user')
    messages: z.array(ChatTurnSchema).max(40).optional(),
    relatedEntityType: z.string().max(100).optional(),
    relatedEntityId: z.string().uuid().optional(),
  })
  .refine((b) => !!b.message || (!!b.messages && b.messages.length > 0), {
    message: 'message or messages required',
  })
  .refine(
    (b) => !b.messages || b.messages[b.messages.length - 1].role === 'user',
    { message: 'last message must be role:user' },
  );

// Allowlist de agentes — preenchida no primeiro hit
let AGENT_ALLOWLIST: Set<string> | null = null;
async function isValidAgent(name: string): Promise<boolean> {
  if (!AGENT_ALLOWLIST) {
    const list = await listAgents();
    AGENT_ALLOWLIST = new Set(list);
  }
  return AGENT_ALLOWLIST.has(name);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agent: string }> },
) {
  // Auth check (middleware já bloqueia, mas reforça)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  // Agent name validation — bloqueia path traversal e nome inválido
  const { agent } = await params;
  if (!agent || agent.includes('/') || agent.includes('..') || agent.length > 60) {
    return Response.json({ error: 'invalid agent' }, { status: 400 });
  }
  if (!(await isValidAgent(agent))) {
    return Response.json({ error: 'unknown agent' }, { status: 404 });
  }

  // Body validation
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'invalid body';
    return Response.json({ error: `invalid body: ${detail}` }, { status: 400 });
  }

  try {
    const result = await runAgentStreaming({
      agent: agent as AgentName,
      userMessage: body.message,
      messages: body.messages,
      triggeredByUserId: user.id,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
    });

    // 1) Consume stream silenciosamente (não lança em erro do provider).
    await result.consumeStream({
      onError: (error) => {
        console.error('[api/agents] consumeStream onError', { agent, error });
      },
    });

    // 2) Lê finishReason/warnings/usage ANTES de tentar `result.text`
    //    (que lança NoOutputGeneratedError quando empty).
    const finishReason = await result.finishReason.catch(() => 'unknown' as const);
    const warnings = await result.warnings.catch(() => undefined);
    const usage = await result.usage.catch(() => undefined);

    // 3) Tenta extrair text — pode lançar se nada foi gerado.
    let text = '';
    let textError: string | null = null;
    try {
      text = await result.text;
    } catch (te) {
      textError = te instanceof Error ? te.message : String(te);
    }

    if (!text || text.trim().length === 0) {
      const warnDetail = warnings && warnings.length > 0
        ? warnings.map((w) => {
            if (w.type === 'other') return w.message;
            return `${w.type}:${w.feature}${w.details ? `(${w.details})` : ''}`;
          }).join('; ')
        : '';
      console.error('[api/agents] empty output', {
        agent,
        finishReason,
        warnings,
        usage,
        textError,
      });
      const parts = [
        `finishReason=${finishReason}`,
        warnDetail ? `warnings=${warnDetail}` : '',
        textError ? `textErr=${textError.slice(0, 200)}` : '',
        usage ? `tokens=${usage.inputTokens ?? '?'}→${usage.outputTokens ?? '?'}` : '',
      ].filter(Boolean).join('; ');
      return Response.json(
        { error: `agent error: empty output (${parts})` },
        { status: 502 },
      );
    }
    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/agents]', { agent, error: msg, stack: e instanceof Error ? e.stack : undefined });
    return Response.json({ error: `agent error: ${msg.slice(0, 300)}` }, { status: 500 });
  }
}
