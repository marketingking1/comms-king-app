import { NextRequest } from 'next/server';
import { runAgentStreaming } from '@/lib/agents/runner';
import { listAgents } from '@/lib/agents/loader';
import type { AgentName } from '@/lib/ai/providers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5min

const BodySchema = z.object({
  message: z.string().min(1).max(50000),
  relatedEntityType: z.string().max(100).optional(),
  relatedEntityId: z.string().uuid().optional(),
});

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
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 });
  }

  try {
    const result = await runAgentStreaming({
      agent: agent as AgentName,
      userMessage: body.message,
      triggeredByUserId: user.id,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error('[api/agents]', e);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
}
