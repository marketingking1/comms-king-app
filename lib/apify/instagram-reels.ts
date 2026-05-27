/**
 * Wrapper Apify p/ Instagram hashtag scraper.
 * Actor: apify/instagram-hashtag-scraper (paid, ~$5/1000 posts).
 *
 * Output relevante por post:
 *   id, shortCode, type ('Video'|'Image'|'Sidecar'), caption, hashtags[], mentions[],
 *   url, displayUrl, videoUrl, videoViewCount, videoPlayCount, videoDuration,
 *   commentsCount, likesCount, timestamp, ownerUsername, ownerFullName, ownerId,
 *   locationName
 */

const APIFY_TOKEN = process.env.APIFY_TOKEN!;

export type RawInstagramPost = {
  id?: string;
  shortCode?: string;
  type?: "Video" | "Image" | "Sidecar";
  caption?: string;
  hashtags?: string[];
  mentions?: string[];
  url?: string;
  displayUrl?: string;
  videoUrl?: string;
  videoViewCount?: number;
  videoPlayCount?: number;
  videoDuration?: number;
  commentsCount?: number;
  likesCount?: number;
  timestamp?: string;
  ownerUsername?: string;
  ownerFullName?: string;
  ownerId?: string;
  locationName?: string;
  // metadata extra do scraper
  isSponsored?: boolean;
  productType?: string;
};

export async function runApifyActor<T = unknown>(
  actorId: string,
  input: object,
  timeoutMs = 240_000,
): Promise<T[]> {
  if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN não configurado");

  // Path canônico Apify usa ~ entre user/name (não /)
  const actorPath = actorId.replace("/", "~");
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${actorPath}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!startRes.ok) {
    const errText = await startRes.text();
    console.error(`[apify] start ${actorPath} failed: ${startRes.status} ${errText.slice(0, 300)}`);
    throw new Error(`Apify start ${actorPath} failed: ${startRes.status}`);
  }
  const startData = (await startRes.json()) as { data: { id: string; defaultDatasetId: string } };
  const runId = startData.data.id;
  const datasetId = startData.data.defaultDatasetId;

  const deadline = Date.now() + timeoutMs;
  let succeeded = false;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      if (!statusRes.ok) continue;
      const statusData = (await statusRes.json()) as { data?: { status?: string } };
      const status = statusData?.data?.status;
      if (!status) continue;
      if (["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"].includes(status)) {
        if (status !== "SUCCEEDED") {
          throw new Error(`Apify run ${actorPath}: ${status}`);
        }
        succeeded = true;
        break;
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Apify run")) throw e;
      continue;
    }
  }
  if (!succeeded) {
    throw new Error(`Apify ${actorPath} timeout after ${Math.round(timeoutMs / 1000)}s`);
  }

  const dataRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true`,
  );
  return (await dataRes.json()) as T[];
}

/**
 * Roda hashtag scraper IG. Retorna posts brutos do Apify.
 *
 * @param hashtags lista sem # (ex: ['viral', 'fyp'])
 * @param resultsLimit por hashtag (default 30)
 */
export async function scrapeInstagramHashtags(
  hashtags: string[],
  resultsLimit = 30,
): Promise<RawInstagramPost[]> {
  if (!hashtags.length) return [];

  const input = {
    hashtags,
    resultsLimit,
    resultsType: "posts",
    addParentData: false,
    // só posts — sem comentários nem stories
    searchType: "hashtag",
  };

  return runApifyActor<RawInstagramPost>("apify/instagram-hashtag-scraper", input);
}
