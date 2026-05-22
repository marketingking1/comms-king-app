/**
 * Client mínimo da Instagram Graph API v21.
 * Token + IG Business ID vêm de env vars (Vercel).
 */

const V = "v21.0";
const TOKEN = process.env.META_LONG_TOKEN!;
const IG_ID = process.env.KING_IG_BUSINESS_ID!;

type FetchOpts = { revalidate?: number };

async function get<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `https://graph.facebook.com/${V}/${path}${sep}access_token=${TOKEN}`;
  const res = await fetch(url, { next: { revalidate: opts.revalidate ?? 600 } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`IG Graph ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export type IgAccountInfo = {
  username: string;
  name?: string;
  biography?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url?: string;
  id: string;
};

export async function getAccountInfo(): Promise<IgAccountInfo> {
  return get<IgAccountInfo>(
    `${IG_ID}?fields=username,name,biography,followers_count,follows_count,media_count,profile_picture_url`,
  );
}

export type IgAccountInsight = {
  reach?: number;
  follower_count?: number;
  profile_views?: number;
  website_clicks?: number;
  accounts_engaged?: number;
};

export async function getAccountInsights(days: number, offsetDays: number = 0): Promise<{
  daily: { date: string; reach: number; follower_count: number }[];
  totals: IgAccountInsight;
}> {
  const since = new Date(Date.now() - (days + offsetDays) * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const until = new Date(Date.now() - offsetDays * 24 * 3600 * 1000).toISOString().slice(0, 10);

  // follower_count só funciona pra últimos 30 dias (Meta API limit) — só pedir se offset=0
  const includeFollowers = offsetDays === 0;
  const timeSeriesMetric = includeFollowers ? "reach,follower_count" : "reach";

  // Time series: pode falhar legitimamente quando follower_count > 30d (catch só esse)
  const timeSeries = await get<{ data: Array<{ name: string; values: Array<{ value: number; end_time: string }> }> }>(
    `${IG_ID}/insights?metric=${timeSeriesMetric}&period=day&since=${since}&until=${until}`,
  ).catch((e) => {
    if (!includeFollowers) return { data: [] }; // erro esperado pra histórico
    console.error("[ig/getAccountInsights] time series:", e);
    throw e; // erro real — propagar
  });

  // Totals: erro = sinal de token expirado ou rate limit, NÃO silenciar
  const totals = await get<{ data: Array<{ name: string; total_value: { value: number } }> }>(
    `${IG_ID}/insights?metric=profile_views,website_clicks,accounts_engaged&metric_type=total_value&period=day&since=${since}&until=${until}`,
  );

  const reachSeries = timeSeries.data.find((x) => x.name === "reach")?.values || [];
  const followerSeries = timeSeries.data.find((x) => x.name === "follower_count")?.values || [];

  const dailyMap = new Map<string, { date: string; reach: number; follower_count: number }>();
  for (const r of reachSeries) {
    const d = r.end_time.slice(0, 10);
    dailyMap.set(d, { date: d, reach: r.value, follower_count: 0 });
  }
  for (const f of followerSeries) {
    const d = f.end_time.slice(0, 10);
    const cur = dailyMap.get(d) ?? { date: d, reach: 0, follower_count: 0 };
    cur.follower_count = f.value;
    dailyMap.set(d, cur);
  }

  return {
    daily: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    totals: {
      profile_views: totals.data.find((x) => x.name === "profile_views")?.total_value.value,
      website_clicks: totals.data.find((x) => x.name === "website_clicks")?.total_value.value,
      accounts_engaged: totals.data.find((x) => x.name === "accounts_engaged")?.total_value.value,
    },
  };
}

export type IgMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "REELS" | "FEED" | "STORY" | "AD";
  timestamp: string;
  permalink: string;
  thumbnail_url?: string;
};

export async function listMedia(limit: number = 25): Promise<IgMedia[]> {
  const r = await get<{ data: IgMedia[] }>(
    `${IG_ID}/media?fields=id,caption,media_type,media_product_type,timestamp,permalink,thumbnail_url&limit=${limit}`,
  );
  return r.data;
}

export type MediaInsights = {
  reach?: number;
  views?: number;
  saved?: number;
  shares?: number;
  comments?: number;
  likes?: number;
  total_interactions?: number;
  ig_reels_avg_watch_time?: number;
  profile_visits?: number;
  follows?: number;
};

export async function getMediaInsights(mediaId: string, isReels: boolean): Promise<MediaInsights> {
  const metric = isReels
    ? "reach,saved,shares,comments,likes,total_interactions,ig_reels_avg_watch_time,views"
    : "reach,saved,shares,comments,likes,total_interactions,profile_visits,follows,views";
  try {
    const r = await get<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
      `${mediaId}/insights?metric=${metric}`,
    );
    const result: MediaInsights = {};
    for (const x of r.data) {
      const key = x.name as keyof MediaInsights;
      (result[key] as number | undefined) = x.values[0]?.value;
    }
    return result;
  } catch {
    return {};
  }
}
