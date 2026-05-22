/**
 * Wrappers cacheados de Instagram Graph API.
 * TTL 60s pra insights (mudam pouco), 30s pra média.
 */
import { unstable_cache } from 'next/cache';
import { getAccountInsights, listMedia, getMediaInsights } from './graph';

export const getAccountInsightsCached = unstable_cache(
  async (days: number, offsetDays: number = 0) =>
    getAccountInsights(days, offsetDays),
  ['ig:account-insights'],
  { revalidate: 60, tags: ['instagram'] },
);

export const listMediaCached = unstable_cache(
  async (limit: number = 25) => listMedia(limit),
  ['ig:media'],
  { revalidate: 30, tags: ['instagram'] },
);

export const getMediaInsightsCached = unstable_cache(
  async (mediaId: string, isReels: boolean) =>
    getMediaInsights(mediaId, isReels),
  ['ig:media-insights'],
  { revalidate: 120, tags: ['instagram'] }, // insights por mídia mudam ainda mais devagar
);
