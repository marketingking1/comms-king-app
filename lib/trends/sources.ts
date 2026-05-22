/**
 * Sources de trending topics. Cada source retorna lista normalizada.
 */

export type RawTrend = {
  source: "google_trends" | "tiktok" | "reddit" | "news" | "twitter";
  topic: string;
  description?: string;
  url?: string;
  thumbnail_url?: string;
  volume_score?: number;
  metadata?: Record<string, unknown>;
};

const APIFY_TOKEN = process.env.APIFY_TOKEN!;

async function runApifyActor(actorId: string, input: object, timeoutMs = 180000): Promise<unknown[]> {
  // Apify path canônico usa ~ entre user/name (não /)
  const actorPath = actorId.replace("/", "~");
  const startRes = await fetch(`https://api.apify.com/v2/acts/${actorPath}/runs?token=${APIFY_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!startRes.ok) {
    const errText = await startRes.text();
    console.error(`[apify] start ${actorPath} failed: ${startRes.status} ${errText.slice(0, 300)}`);
    throw new Error(`Apify start ${actorPath} failed: ${startRes.status}`);
  }
  const startData = (await startRes.json()) as { data: { id: string; defaultDatasetId: string } };
  const runId = startData.data.id;
  const datasetId = startData.data.defaultDatasetId;

  // Poll status com deadline real
  const deadline = Date.now() + timeoutMs;
  let succeeded = false;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    let status: string | undefined;
    try {
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      if (!statusRes.ok) continue;
      const statusData = await statusRes.json() as { data?: { status?: string } };
      status = statusData?.data?.status;
    } catch {
      continue;
    }
    if (!status) continue;
    if (["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"].includes(status)) {
      if (status !== "SUCCEEDED") {
        throw new Error(`Apify run ${actorPath}: ${status}`);
      }
      succeeded = true;
      break;
    }
  }
  if (!succeeded) {
    throw new Error(`Apify ${actorPath} timeout after ${Math.round(timeoutMs / 1000)}s`);
  }

  // Pegar dataset
  const dataRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true`,
  );
  return (await dataRes.json()) as unknown[];
}

// =========================================================
// GOOGLE TRENDS — daily trends Brasil
// =========================================================

export async function getGoogleTrendsDaily(): Promise<RawTrend[]> {
  // Actor "emastra/google-trends-daily" ou similar — vou usar o realtime trends
  // Alternativa: scrape direto trends.google.com/trending feed RSS
  try {
    const res = await fetch(
      "https://trends.google.com/trending/rss?geo=BR",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error(`Google Trends RSS ${res.status}`);
    const xml = await res.text();
    return parseGoogleTrendsRSS(xml);
  } catch (e) {
    console.error("[google_trends]", e);
    return [];
  }
}

function parseGoogleTrendsRSS(xml: string): RawTrend[] {
  const items: RawTrend[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const m of itemMatches) {
    const block = m[1];
    const title = extractTag(block, "title");
    const trafficStr = extractTag(block, "ht:approx_traffic");
    const traffic = trafficStr ? parseInt(trafficStr.replace(/[^\d]/g, ""), 10) || 0 : 0;
    const news = extractTag(block, "ht:news_item_title");
    const url = extractTag(block, "ht:news_item_url");
    const pic = extractTag(block, "ht:picture");

    if (title) {
      items.push({
        source: "google_trends",
        topic: title,
        description: news,
        url,
        thumbnail_url: pic,
        volume_score: traffic,
        metadata: { traffic_raw: trafficStr },
      });
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag.replace(/:/g, "\\:")}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag.replace(/:/g, "\\:")}>`);
  const m = xml.match(re);
  return m ? m[1].trim() : undefined;
}

// =========================================================
// TIKTOK — trending hashtags Brasil
// =========================================================

export async function getTikTokTrending(): Promise<RawTrend[]> {
  try {
    const items = (await runApifyActor("clockworks/free-tiktok-scraper", {
      hashtags: ["fyp", "viral", "trending"],
      resultsPerPage: 30,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    }, 120000)) as Array<{
      videoMeta?: { duration?: number };
      text?: string;
      hashtags?: Array<{ name: string }>;
      playCount?: number;
      diggCount?: number;
      webVideoUrl?: string;
      authorMeta?: { name?: string };
    }>;

    // Agrupar por hashtag, somar plays
    const hashtagMap = new Map<string, { plays: number; samples: string[]; url?: string }>();
    for (const v of items) {
      const tags = v.hashtags || [];
      for (const t of tags) {
        const tagName = t.name?.toLowerCase();
        if (!tagName || ["fyp", "viral", "trending", "foryou", "foryoupage"].includes(tagName)) continue;
        const cur = hashtagMap.get(tagName) || { plays: 0, samples: [], url: v.webVideoUrl };
        cur.plays += v.playCount || 0;
        if (v.text && cur.samples.length < 3) cur.samples.push(v.text.slice(0, 200));
        hashtagMap.set(tagName, cur);
      }
    }

    return Array.from(hashtagMap.entries())
      .sort((a, b) => b[1].plays - a[1].plays)
      .slice(0, 20)
      .map(([tag, data]) => ({
        source: "tiktok" as const,
        topic: `#${tag}`,
        description: data.samples[0],
        url: data.url,
        volume_score: data.plays,
        metadata: { samples: data.samples },
      }));
  } catch (e) {
    console.error("[tiktok]", e);
    return [];
  }
}

// =========================================================
// REDDIT — r/brasil + r/brasilivre hot
// =========================================================

export async function getRedditTrending(): Promise<RawTrend[]> {
  try {
    const items = (await runApifyActor("trudax/reddit-scraper-lite", {
      startUrls: [
        { url: "https://www.reddit.com/r/brasil/hot/.json?limit=15" },
        { url: "https://www.reddit.com/r/brasilivre/hot/.json?limit=10" },
      ],
      type: "post",
      sort: "hot",
      maxItems: 25,
      proxy: { useApifyProxy: true },
    }, 120000)) as Array<{
      title?: string;
      description?: string;
      url?: string;
      numberOfComments?: number;
      upVotes?: number;
      thumbnailUrl?: string;
      subreddit?: string;
    }>;

    return items
      .filter((p) => p.title)
      .slice(0, 20)
      .map((p) => ({
        source: "reddit" as const,
        topic: p.title!,
        description: p.description?.slice(0, 200),
        url: p.url,
        thumbnail_url: p.thumbnailUrl,
        volume_score: (p.upVotes || 0) + (p.numberOfComments || 0) * 2,
        metadata: { subreddit: p.subreddit, comments: p.numberOfComments, upvotes: p.upVotes },
      }));
  } catch (e) {
    console.error("[reddit]", e);
    return [];
  }
}

// =========================================================
// NEWS — manchetes do dia Brasil (via Apify ou scrape leve)
// =========================================================

export async function getNewsTrending(): Promise<RawTrend[]> {
  // Usa Google News RSS Brasil — leve, free
  try {
    const res = await fetch(
      "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419",
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) throw new Error(`Google News RSS ${res.status}`);
    const xml = await res.text();
    return parseNewsRSS(xml).slice(0, 20);
  } catch (e) {
    console.error("[news]", e);
    return [];
  }
}

function parseNewsRSS(xml: string): RawTrend[] {
  const items: RawTrend[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const m of itemMatches) {
    const block = m[1];
    const titleRaw = extractTag(block, "title");
    const link = extractTag(block, "link");
    const desc = extractTag(block, "description");
    const source = extractTag(block, "source");
    const pubDate = extractTag(block, "pubDate");

    if (titleRaw) {
      // Limpar título — "Tópico - Fonte"
      const sepIdx = titleRaw.lastIndexOf(" - ");
      const topic = sepIdx > 0 ? titleRaw.slice(0, sepIdx) : titleRaw;
      const sourceFromTitle = sepIdx > 0 ? titleRaw.slice(sepIdx + 3) : source;

      items.push({
        source: "news",
        topic,
        description: stripHtml(desc || "").slice(0, 300),
        url: link,
        metadata: { source: sourceFromTitle, pubDate },
      });
    }
  }
  return items;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

// =========================================================
// TWITTER / X — trending topics Brasil (karamelo actor)
// =========================================================

export async function getTwitterTrending(): Promise<RawTrend[]> {
  try {
    const items = (await runApifyActor("karamelo/twitter-trends-scraper", {
      country: "30", // Brazil
      live: true,
      hour24: true,
    }, 180000)) as Array<{
      trend?: string;
      volume?: string;
      timePeriod?: string;
      time?: string;
    }>;

    // Dedup por trend (Live + hour24 podem repetir)
    const seen = new Map<string, { volume: number; periods: string[] }>();
    for (const v of items) {
      if (!v.trend) continue;
      const trend = v.trend.trim();
      // Volume vem como "10K", "100K", "1M" ou ""
      const vol = parseVolumeStr(v.volume || "");
      const cur = seen.get(trend) || { volume: 0, periods: [] };
      cur.volume = Math.max(cur.volume, vol);
      if (v.timePeriod && !cur.periods.includes(v.timePeriod)) cur.periods.push(v.timePeriod);
      seen.set(trend, cur);
    }

    return Array.from(seen.entries())
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 30)
      .map(([trend, data]) => ({
        source: "twitter" as const,
        topic: trend,
        description: data.periods.includes("Live")
          ? "Em alta agora"
          : `Em alta nas últimas ${data.periods.join(" / ")}`,
        url: `https://x.com/search?q=${encodeURIComponent(trend)}&src=trend_click`,
        volume_score: data.volume || undefined,
        metadata: { periods: data.periods },
      }));
  } catch (e) {
    console.error("[twitter]", e);
    return [];
  }
}

function parseVolumeStr(v: string): number {
  if (!v) return 0;
  const m = v.match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  const unit = (m[2] || "").toUpperCase();
  if (unit === "K") return num * 1000;
  if (unit === "M") return num * 1_000_000;
  if (unit === "B") return num * 1_000_000_000;
  return num;
}
