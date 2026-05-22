import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Diagnóstico: pinga Anthropic + OpenAI com payload mínimo (1 token).
 * Útil pra confirmar billing/auth de cada provider.
 * Acesso só pra user logado.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const diagnostics: Record<string, unknown> = {
    anthropic: {
      hasKey: !!process.env.ANTHROPIC_API_KEY,
      keyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 12) ?? null,
      keyLength: process.env.ANTHROPIC_API_KEY?.length ?? 0,
    },
    openai: {
      hasKey: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY?.slice(0, 12) ?? null,
      keyLength: process.env.OPENAI_API_KEY?.length ?? 0,
    },
    nodeVersion: process.version,
  };

  const targets: Array<{ provider: string; model: string; factory: () => ReturnType<typeof anthropic> | ReturnType<typeof openai> }> = [
    { provider: 'openai', model: 'gpt-5.5', factory: () => openai('gpt-5.5') },
    { provider: 'openai', model: 'gpt-5.4', factory: () => openai('gpt-5.4') },
    { provider: 'openai', model: 'gpt-5.4-mini', factory: () => openai('gpt-5.4-mini') },
    { provider: 'openai', model: 'gpt-5.1', factory: () => openai('gpt-5.1') },
    { provider: 'openai', model: 'gpt-4o', factory: () => openai('gpt-4o') },
    { provider: 'openai', model: 'gpt-4o-mini', factory: () => openai('gpt-4o-mini') },
    { provider: 'anthropic', model: 'claude-opus-4-7', factory: () => anthropic('claude-opus-4-7') },
  ];

  for (const t of targets) {
    try {
      const startedAt = Date.now();
      const result = await generateText({
        model: t.factory(),
        prompt: 'Reply with exactly: PONG',
        maxOutputTokens: 32, // OpenAI exige >= 16
      });
      diagnostics[`${t.provider}:${t.model}`] = {
        ok: true,
        text: result.text,
        finishReason: result.finishReason,
        usage: result.usage,
        durationMs: Date.now() - startedAt,
      };
    } catch (e) {
      const err = e as Error & { statusCode?: number; cause?: unknown; responseBody?: string };
      diagnostics[`${t.provider}:${t.model}`] = {
        ok: false,
        error: err.message,
        statusCode: err.statusCode,
        responseBody: err.responseBody ? String(err.responseBody).slice(0, 300) : undefined,
      };
    }
  }

  return Response.json(diagnostics);
}
