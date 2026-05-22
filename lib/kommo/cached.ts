/**
 * Wrappers cacheados de Kommo client.
 * TTL 30s — leads não mudam tão rápido que valha repuxar a cada page load.
 * Cache compartilhado entre requests (não é per-user), ok pq usa token único
 * de servidor.
 */
import { unstable_cache } from 'next/cache';
import { listLeads, listPipelines, listUsers } from './client';
import type { KommoLead, Pipeline, User } from './client';

const TTL_SECONDS = 30;

export const listPipelinesCached = unstable_cache(
  async (): Promise<Pipeline[]> => listPipelines(),
  ['kommo:pipelines'],
  { revalidate: TTL_SECONDS, tags: ['kommo'] },
);

export const listUsersCached = unstable_cache(
  async (): Promise<User[]> => listUsers(),
  ['kommo:users'],
  { revalidate: TTL_SECONDS, tags: ['kommo'] },
);

export const listLeadsCached = unstable_cache(
  async (opts: Parameters<typeof listLeads>[0]): Promise<KommoLead[]> => listLeads(opts),
  ['kommo:leads'],
  { revalidate: TTL_SECONDS, tags: ['kommo'] },
);
