/**
 * Análises avançadas sobre IgMedia + MediaInsights — geram hipóteses.
 */

import type { IgMedia, MediaInsights } from "./graph";

export type PieceWithInsights = {
  media: IgMedia;
  insights: MediaInsights;
};

// =========================================================
// Derived metrics
// =========================================================

export function shareRate(p: PieceWithInsights): number {
  const reach = p.insights.reach || 0;
  return reach > 0 ? (p.insights.shares || 0) / reach : 0;
}

export function saveRate(p: PieceWithInsights): number {
  const reach = p.insights.reach || 0;
  return reach > 0 ? (p.insights.saved || 0) / reach : 0;
}

export function commentRate(p: PieceWithInsights): number {
  const reach = p.insights.reach || 0;
  return reach > 0 ? (p.insights.comments || 0) / reach : 0;
}

export function engagementRate(p: PieceWithInsights): number {
  const reach = p.insights.reach || 0;
  return reach > 0 ? (p.insights.total_interactions || 0) / reach : 0;
}

export function watchThroughRate(p: PieceWithInsights, expectedDuration = 30): number {
  if (!p.insights.ig_reels_avg_watch_time) return 0;
  return Math.min(1, p.insights.ig_reels_avg_watch_time / 1000 / expectedDuration);
}

export function profileVisitRate(p: PieceWithInsights): number {
  const reach = p.insights.reach || 0;
  return reach > 0 ? (p.insights.profile_visits || 0) / reach : 0;
}

// =========================================================
// Aggregations
// =========================================================

export type GroupStats = {
  count: number;
  reach: number;
  views: number;
  saved: number;
  shares: number;
  comments: number;
  likes: number;
  total_interactions: number;
  avgShareRate: number;
  avgSaveRate: number;
  avgCommentRate: number;
  avgEngagementRate: number;
};

function blankStats(): GroupStats {
  return {
    count: 0, reach: 0, views: 0, saved: 0, shares: 0,
    comments: 0, likes: 0, total_interactions: 0,
    avgShareRate: 0, avgSaveRate: 0, avgCommentRate: 0, avgEngagementRate: 0,
  };
}

function finalizeStats(s: GroupStats, items: PieceWithInsights[]): GroupStats {
  if (items.length === 0) return s;
  s.avgShareRate = items.reduce((a, p) => a + shareRate(p), 0) / items.length;
  s.avgSaveRate = items.reduce((a, p) => a + saveRate(p), 0) / items.length;
  s.avgCommentRate = items.reduce((a, p) => a + commentRate(p), 0) / items.length;
  s.avgEngagementRate = items.reduce((a, p) => a + engagementRate(p), 0) / items.length;
  return s;
}

function aggregate(items: PieceWithInsights[]): GroupStats {
  const s = blankStats();
  for (const p of items) {
    s.count++;
    s.reach += p.insights.reach || 0;
    s.views += p.insights.views || 0;
    s.saved += p.insights.saved || 0;
    s.shares += p.insights.shares || 0;
    s.comments += p.insights.comments || 0;
    s.likes += p.insights.likes || 0;
    s.total_interactions += p.insights.total_interactions || 0;
  }
  return finalizeStats(s, items);
}

export function statsByFormat(pieces: PieceWithInsights[]): Map<string, GroupStats> {
  const byFormat = new Map<string, PieceWithInsights[]>();
  for (const p of pieces) {
    const key = p.media.media_product_type || p.media.media_type;
    if (!byFormat.has(key)) byFormat.set(key, []);
    byFormat.get(key)!.push(p);
  }
  const result = new Map<string, GroupStats>();
  for (const [k, v] of byFormat) result.set(k, aggregate(v));
  return result;
}

// =========================================================
// Best time to post — heatmap day x hour
// =========================================================

export type HeatmapCell = {
  dayOfWeek: number;  // 0=dom
  hour: number;        // 0-23
  count: number;
  avgReach: number;
  avgEngagement: number;
  avgShareRate: number;
};

export function buildHeatmap(pieces: PieceWithInsights[]): HeatmapCell[] {
  // Agrupa por (dia, hora)
  const buckets = new Map<string, PieceWithInsights[]>();
  for (const p of pieces) {
    const dt = new Date(p.media.timestamp);
    const key = `${dt.getDay()}-${dt.getHours()}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p);
  }

  const cells: HeatmapCell[] = [];
  for (const [key, items] of buckets) {
    const [dayOfWeek, hour] = key.split("-").map(Number);
    const avgReach = items.reduce((a, p) => a + (p.insights.reach || 0), 0) / items.length;
    const avgEng = items.reduce((a, p) => a + engagementRate(p), 0) / items.length;
    const avgShare = items.reduce((a, p) => a + shareRate(p), 0) / items.length;
    cells.push({
      dayOfWeek,
      hour,
      count: items.length,
      avgReach,
      avgEngagement: avgEng,
      avgShareRate: avgShare,
    });
  }
  return cells;
}

// =========================================================
// Hashtag analysis
// =========================================================

export type HashtagStat = {
  tag: string;
  count: number;
  avgReach: number;
  avgEngagement: number;
  avgShareRate: number;
  totalReach: number;
};

const HASHTAG_REGEX = /#(\w+)/g;

function extractHashtags(caption: string | undefined): string[] {
  if (!caption) return [];
  const tags: string[] = [];
  let m;
  while ((m = HASHTAG_REGEX.exec(caption)) !== null) {
    tags.push(m[1].toLowerCase());
  }
  return tags;
}

export function statsByHashtag(pieces: PieceWithInsights[]): HashtagStat[] {
  const byTag = new Map<string, PieceWithInsights[]>();
  for (const p of pieces) {
    const tags = extractHashtags(p.media.caption);
    for (const t of tags) {
      if (!byTag.has(t)) byTag.set(t, []);
      byTag.get(t)!.push(p);
    }
  }
  const result: HashtagStat[] = [];
  for (const [tag, items] of byTag) {
    const totalReach = items.reduce((a, p) => a + (p.insights.reach || 0), 0);
    result.push({
      tag,
      count: items.length,
      avgReach: totalReach / items.length,
      avgEngagement: items.reduce((a, p) => a + engagementRate(p), 0) / items.length,
      avgShareRate: items.reduce((a, p) => a + shareRate(p), 0) / items.length,
      totalReach,
    });
  }
  return result.sort((a, b) => b.totalReach - a.totalReach);
}

// =========================================================
// Caption length analysis
// =========================================================

export type CaptionLengthBucket = {
  range: string;
  min: number;
  max: number;
  count: number;
  avgReach: number;
  avgEngagement: number;
  avgShareRate: number;
};

export function statsByCaptionLength(pieces: PieceWithInsights[]): CaptionLengthBucket[] {
  const buckets: CaptionLengthBucket[] = [
    { range: "< 100", min: 0, max: 99, count: 0, avgReach: 0, avgEngagement: 0, avgShareRate: 0 },
    { range: "100-300", min: 100, max: 299, count: 0, avgReach: 0, avgEngagement: 0, avgShareRate: 0 },
    { range: "300-600", min: 300, max: 599, count: 0, avgReach: 0, avgEngagement: 0, avgShareRate: 0 },
    { range: "600-1000", min: 600, max: 999, count: 0, avgReach: 0, avgEngagement: 0, avgShareRate: 0 },
    { range: "1000+", min: 1000, max: 99999, count: 0, avgReach: 0, avgEngagement: 0, avgShareRate: 0 },
  ];
  const byBucket: Record<string, PieceWithInsights[]> = {};
  for (const p of pieces) {
    const len = (p.media.caption || "").length;
    const b = buckets.find((x) => len >= x.min && len <= x.max)!;
    if (!byBucket[b.range]) byBucket[b.range] = [];
    byBucket[b.range].push(p);
  }
  for (const b of buckets) {
    const items = byBucket[b.range] || [];
    b.count = items.length;
    if (items.length > 0) {
      b.avgReach = items.reduce((a, p) => a + (p.insights.reach || 0), 0) / items.length;
      b.avgEngagement = items.reduce((a, p) => a + engagementRate(p), 0) / items.length;
      b.avgShareRate = items.reduce((a, p) => a + shareRate(p), 0) / items.length;
    }
  }
  return buckets;
}

// =========================================================
// Top/bottom analyzers
// =========================================================

export function top(
  pieces: PieceWithInsights[],
  metric: (p: PieceWithInsights) => number,
  n = 5,
): PieceWithInsights[] {
  return [...pieces].sort((a, b) => metric(b) - metric(a)).slice(0, n);
}

export function bottom(
  pieces: PieceWithInsights[],
  metric: (p: PieceWithInsights) => number,
  n = 5,
): PieceWithInsights[] {
  // só peças com reach > 0 — bottom de zero não diz nada
  return [...pieces]
    .filter((p) => (p.insights.reach || 0) > 50)
    .sort((a, b) => metric(a) - metric(b))
    .slice(0, n);
}

// =========================================================
// Word frequency in top vs bottom (insight de palavras vencedoras)
// =========================================================

const STOPWORDS = new Set([
  "a", "o", "e", "de", "da", "do", "que", "para", "com", "em", "se", "no", "na",
  "os", "as", "dos", "das", "por", "uma", "um", "mais", "como", "mas", "ao",
  "foi", "ser", "sua", "seu", "esse", "essa", "isso", "esses", "essas", "esta",
  "este", "isto", "estas", "estes", "the", "and", "or", "of", "to", "in", "is",
  "you", "your", "this", "that", "for", "on", "with",
]);

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[#@][\w]+/g, "")  // remove hashtags + mentions
    .replace(/[^\wáéíóúâêîôûãõçñ\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

export function wordsInGroup(pieces: PieceWithInsights[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const p of pieces) {
    const words = new Set(tokenize(p.media.caption || ""));
    for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  }
  return freq;
}

export function wordsTopVsBottom(
  topPieces: PieceWithInsights[],
  bottomPieces: PieceWithInsights[],
): Array<{ word: string; topRatio: number; bottomRatio: number; lift: number }> {
  const topFreq = wordsInGroup(topPieces);
  const botFreq = wordsInGroup(bottomPieces);
  const tn = topPieces.length || 1;
  const bn = bottomPieces.length || 1;
  const all = new Set([...topFreq.keys(), ...botFreq.keys()]);
  const result: Array<{ word: string; topRatio: number; bottomRatio: number; lift: number }> = [];
  for (const w of all) {
    const tr = (topFreq.get(w) || 0) / tn;
    const br = (botFreq.get(w) || 0) / bn;
    // só palavras que aparecem em mín 2 do top
    if ((topFreq.get(w) || 0) < 2) continue;
    const lift = tr / Math.max(br, 0.01);
    result.push({ word: w, topRatio: tr, bottomRatio: br, lift });
  }
  return result.sort((a, b) => b.lift - a.lift);
}

// =========================================================
// Velocity (peças que aceleraram nas primeiras 24h)
// Mock — IG não dá história de reach hora-a-hora via API. Aproximação:
// peças com idade <48h e reach já alto.
// =========================================================

export function recentVelocity(pieces: PieceWithInsights[]): PieceWithInsights[] {
  const now = Date.now();
  return pieces
    .filter((p) => {
      const ageHours = (now - new Date(p.media.timestamp).getTime()) / 3600000;
      return ageHours < 72 && (p.insights.reach || 0) > 500;
    })
    .sort((a, b) => (b.insights.reach || 0) - (a.insights.reach || 0));
}

// =========================================================
// Comparativo período atual vs anterior
// =========================================================

export type PeriodCompare = {
  current: { count: number; reach: number; engagement: number; saves: number; shares: number };
  previous: { count: number; reach: number; engagement: number; saves: number; shares: number };
  delta: { reach: number; engagement: number; saves: number; shares: number };
};

export function comparePerformance(
  currentPieces: PieceWithInsights[],
  previousPieces: PieceWithInsights[],
): PeriodCompare {
  function summarize(items: PieceWithInsights[]) {
    return {
      count: items.length,
      reach: items.reduce((a, p) => a + (p.insights.reach || 0), 0),
      engagement: items.reduce((a, p) => a + (p.insights.total_interactions || 0), 0),
      saves: items.reduce((a, p) => a + (p.insights.saved || 0), 0),
      shares: items.reduce((a, p) => a + (p.insights.shares || 0), 0),
    };
  }
  const cur = summarize(currentPieces);
  const prev = summarize(previousPieces);
  function pct(a: number, b: number) {
    if (b === 0) return a > 0 ? 100 : 0;
    return ((a - b) / b) * 100;
  }
  return {
    current: cur,
    previous: prev,
    delta: {
      reach: pct(cur.reach, prev.reach),
      engagement: pct(cur.engagement, prev.engagement),
      saves: pct(cur.saves, prev.saves),
      shares: pct(cur.shares, prev.shares),
    },
  };
}
