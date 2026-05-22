import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const keyPrefix = process.env.ANTHROPIC_API_KEY?.slice(0, 12) ?? null;
  const keyLength = process.env.ANTHROPIC_API_KEY?.length ?? 0;

  const diagnostics: Record<string, unknown> = {
    hasKey,
    keyPrefix,
    keyLength,
    nodeVersion: process.version,
  };

  if (!hasKey) {
    return Response.json({ ...diagnostics, error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });
  }

  // Try Opus 4.7 + Sonnet 4.6 com payload mínimo
  for (const model of ['claude-opus-4-7', 'claude-sonnet-4-6'] as const) {
    try {
      const startedAt = Date.now();
      const result = await generateText({
        model: anthropic(model),
        prompt: 'Reply with exactly: PONG',
        maxOutputTokens: 10,
      });
      diagnostics[model] = {
        ok: true,
        text: result.text,
        finishReason: result.finishReason,
        usage: result.usage,
        warnings: result.warnings,
        durationMs: Date.now() - startedAt,
      };
    } catch (e) {
      const err = e as Error & { statusCode?: number; cause?: unknown; responseBody?: string };
      diagnostics[model] = {
        ok: false,
        error: err.message,
        statusCode: err.statusCode,
        cause: err.cause ? String(err.cause).slice(0, 300) : undefined,
        responseBody: err.responseBody ? String(err.responseBody).slice(0, 300) : undefined,
      };
    }
  }

  return Response.json(diagnostics);
}
