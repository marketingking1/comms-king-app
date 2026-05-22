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

    // textStream LANÇA quando o provider erra (network, rate limit, etc).
    // fullStream engolia o erro silenciosamente em parts type:'error' que
    // o Anthropic provider às vezes nem emite — daí o "stream vazio".
    const encoder = new TextEncoder();

    const textStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const delta of result.textStream) {
            if (delta) controller.enqueue(encoder.encode(delta));
          }
          controller.close();
        } catch (e) {
          const err = e as Error & { statusCode?: number; cause?: unknown; responseBody?: string };
          const msg = err.message || String(err);
          const detail = err.responseBody || (err.cause ? String(err.cause) : '') || '';
          console.error('[api/agents] textStream threw', {
            agent,
            message: msg,
            statusCode: err.statusCode,
            cause: err.cause,
            responseBody: err.responseBody,
            stack: err.stack,
          });
          try {
            controller.enqueue(
              encoder.encode(
                `\n\n[STREAM ERROR] ${msg.slice(0, 400)}${detail ? ` :: ${String(detail).slice(0, 300)}` : ''}`,
              ),
            );
          } catch {
            // controller pode já estar fechado
          }
          controller.close();
        }
      },
    });

    return new Response(textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Agent': agent,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/agents]', { agent, error: msg, stack: e instanceof Error ? e.stack : undefined });
    return Response.json({ error: `agent error: ${msg.slice(0, 300)}` }, { status: 500 });
  }
}
