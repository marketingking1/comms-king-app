import { NextRequest } from 'next/server';
import { runAgentStreaming } from '@/lib/agents/runner';
import type { AgentName } from '@/lib/ai/providers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5min

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agent: string }> },
) {
  const { agent } = await params;
  const body = await request.json();

  if (!body.message) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  // Auth opcional no F0; obrigatório em F1
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const result = await runAgentStreaming({
      agent: agent as AgentName,
      userMessage: body.message,
      triggeredByUserId: user?.id,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 500 });
  }
}
