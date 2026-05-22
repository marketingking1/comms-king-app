import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

/**
 * Routing de provider por agente — equilibra qualidade vs custo.
 * Opus: estratégia profunda
 * Sonnet: criação/qualidade
 * GPT-4o-mini: utilitários baratos
 */
export type AgentName =
  | 'comms-head'
  | 'comms-million-strategist'
  | 'comms-zeitgeist-hunter'
  | 'comms-storyteller-viral'
  | 'comms-funnel-curator'
  | 'comms-scriptwriter'
  | 'comms-edit-director'
  | 'comms-editorial-producer'
  | 'comms-community-manager'
  | 'comms-analyst-io';

type ProviderRoute = {
  provider: 'anthropic' | 'openai';
  model: string;
  maxTokens: number;
};

// Stack OpenAI top-tier (maio 2026).
// gpt-5.5: estratégico/criativo — flagship Abr/26, melhor pra prompts grandes
// gpt-5.4-mini: utilitários — bem mais inteligente que gpt-4o-mini, custo OK
const ROUTING: Record<AgentName, ProviderRoute> = {
  'comms-head': {
    provider: 'openai',
    model: 'gpt-5.5',
    maxTokens: 8000,
  },
  'comms-million-strategist': {
    provider: 'openai',
    model: 'gpt-5.5',
    maxTokens: 8000,
  },
  'comms-storyteller-viral': {
    provider: 'openai',
    model: 'gpt-5.5',
    maxTokens: 8000,
  },
  'comms-scriptwriter': {
    provider: 'openai',
    model: 'gpt-5.5',
    maxTokens: 6000,
  },
  'comms-zeitgeist-hunter': {
    provider: 'openai',
    model: 'gpt-5.4-mini',
    maxTokens: 4000,
  },
  'comms-community-manager': {
    provider: 'openai',
    model: 'gpt-5.4-mini',
    maxTokens: 4000,
  },
  'comms-analyst-io': {
    provider: 'openai',
    model: 'gpt-5.4-mini',
    maxTokens: 5000,
  },
  'comms-funnel-curator': {
    provider: 'openai',
    model: 'gpt-5.4-mini',
    maxTokens: 2000,
  },
  'comms-edit-director': {
    provider: 'openai',
    model: 'gpt-5.4-mini',
    maxTokens: 3000,
  },
  'comms-editorial-producer': {
    provider: 'openai',
    model: 'gpt-5.4-mini',
    maxTokens: 2500,
  },
};

export function getAgentRoute(agent: AgentName): ProviderRoute {
  const route = ROUTING[agent];
  if (!route) throw new Error(`Unknown agent: ${agent}`);
  return route;
}

export function getModel(agent: AgentName) {
  const { provider, model } = getAgentRoute(agent);
  return provider === 'anthropic' ? anthropic(model) : openai(model);
}

// Pricing (USD per 1M tokens) — para logging em comms.agent_runs.
// Valores GPT-5.x estimados (ajustar quando OpenAI publicar tabela final).
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-7': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'gpt-5.5': { input: 10, output: 40 },
  'gpt-5.4': { input: 5, output: 20 },
  'gpt-5.4-mini': { input: 1.2, output: 4.8 },
  'gpt-5.1': { input: 4, output: 16 },
  'gpt-5-mini': { input: 1, output: 4 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model];
  if (!p) return 0;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
