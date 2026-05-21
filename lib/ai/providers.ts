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

const ROUTING: Record<AgentName, ProviderRoute> = {
  'comms-head': {
    provider: 'anthropic',
    model: 'claude-opus-4-7',
    maxTokens: 8000,
  },
  'comms-million-strategist': {
    provider: 'anthropic',
    model: 'claude-opus-4-7',
    maxTokens: 8000,
  },
  'comms-storyteller-viral': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    maxTokens: 6000,
  },
  'comms-zeitgeist-hunter': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    maxTokens: 4000,
  },
  'comms-scriptwriter': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    maxTokens: 6000,
  },
  'comms-community-manager': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    maxTokens: 4000,
  },
  'comms-analyst-io': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    maxTokens: 5000,
  },
  'comms-funnel-curator': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 2000,
  },
  'comms-edit-director': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 3000,
  },
  'comms-editorial-producer': {
    provider: 'openai',
    model: 'gpt-4o-mini',
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

// Pricing (USD per 1M tokens) — para logging em comms.agent_runs
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-7': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model];
  if (!p) return 0;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
