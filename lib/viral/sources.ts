/**
 * Source de vídeos virais do dia.
 * Por enquanto: Instagram Reels via Apify hashtag scraper.
 *
 * Estratégia: 5 hashtags amplas BR + janela 48h + dedup por shortCode + sort views desc.
 */

import { scrapeInstagramHashtags, type RawInstagramPost } from "@/lib/apify/instagram-reels";

export type ViralVideoRow = {
  platform: "instagram";
  external_id: string;
  url: string;
  caption: string | null;
  hashtag_source: string | null;
  hashtags: string[];

  author_username: string | null;
  author_full_name: string | null;
  author_profile_url: string | null;
  author_id: string | null;

  thumbnail_url: string | null;
  video_url: string | null;
  media_type: "video" | "image" | "carousel" | null;
  duration_sec: number | null;

  views_count: number | null;
  likes_count: number | null;
  comments_count: number | null;

  posted_at: string | null;
  expires_at: string;
  metadata: Record<string, unknown>;
};

// Hashtags virais gerais BR — PT-BR explicitas (sem #viral/#fyp/#trending genéricas
// que dominam India/global). Combinadas com filtro de idioma na caption.
export const HASHTAGS_VIRAL_BR = [
  "humorbrasil",
  "humorbr",
  "humordobrasil",
  "comediabrasileira",
  "memesbrasil",
  "viralbrasil",
  "engracado",
  "tiktokbrasil",
];

const WINDOW_HOURS = 48;
const KING_OWN_USERNAME = "kingoflanguagesoficial"; // auto-skip pra não comentar no próprio perfil

// Heurística leve pra confirmar que a caption é PT-BR (defesa em profundidade —
// mesmo buscando hashtag PT, vem ruído de criadores estrangeiros que usam tag BR
// como spam de discovery).
const PT_ACCENT_RE = /[áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇñÑ]/;
const PT_STOPWORDS = [
  " que ", " não ", " nao ", " uma ", " com ", " para ", " você ", " voce ",
  " seu ", " sua ", " meu ", " minha ", " quem ", " mais ", " muito ", " tudo ",
  " tem ", " ter ", " esta ", " está ", " esse ", " essa ", " isso ", " aqui ",
  " pra ", " pro ", " hoje ", " quando ", " porque ", " agora ", " também ",
  " tambem ", " gente ", " kkk", " rsrs", " hahaha", " mano ", " cara ",
];

function isPortugueseCaption(caption: string | null | undefined): boolean {
  if (!caption) return false; // sem caption não dá pra confirmar — descarta por padrão
  const lower = ` ${caption.toLowerCase()} `;
  if (PT_ACCENT_RE.test(caption)) return true;
  let hits = 0;
  for (const sw of PT_STOPWORDS) {
    if (lower.includes(sw)) {
      hits++;
      if (hits >= 2) return true;
    }
  }
  return false;
}

/**
 * Pega virais do Instagram nas hashtags definidas, normaliza, dedup, filtra janela e perfil próprio.
 */
export async function getInstagramViralsBR(opts?: {
  hashtags?: string[];
  resultsPerHashtag?: number;
}): Promise<ViralVideoRow[]> {
  const hashtags = opts?.hashtags ?? HASHTAGS_VIRAL_BR;
  const resultsPerHashtag = opts?.resultsPerHashtag ?? 30;

  // Tenta TODAS as hashtags numa única chamada do actor (suporta multi-hashtag input)
  let raw: RawInstagramPost[] = [];
  try {
    raw = await scrapeInstagramHashtags(hashtags, resultsPerHashtag);
  } catch (e) {
    console.error("[viral/sources] apify failed:", e);
    return [];
  }

  // Atribui hashtag_source: matcha primeira hashtag do post que está na lista nossa
  const ourSet = new Set(hashtags.map((h) => h.toLowerCase()));

  // Dedup por shortCode/id
  const seen = new Set<string>();
  const out: ViralVideoRow[] = [];
  const sinceMs = Date.now() - WINDOW_HOURS * 3600 * 1000;

  for (const p of raw) {
    const externalId = p.shortCode || p.id;
    if (!externalId) continue;
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    // Auto-skip nosso próprio perfil
    if (p.ownerUsername?.toLowerCase() === KING_OWN_USERNAME) continue;

    // Filtra janela 48h
    const postedAt = p.timestamp ? new Date(p.timestamp).getTime() : null;
    if (postedAt && postedAt < sinceMs) continue;

    // Filtra idioma — só PT-BR
    if (!isPortugueseCaption(p.caption)) continue;

    const mediaType = p.type === "Video" ? "video"
      : p.type === "Sidecar" ? "carousel"
      : p.type === "Image" ? "image"
      : null;

    // hashtag_source: 1ª hashtag do post que está na nossa lista
    const sourceTag = (p.hashtags || [])
      .map((h) => h.toLowerCase())
      .find((h) => ourSet.has(h)) || null;

    const views = p.videoPlayCount ?? p.videoViewCount ?? null;

    out.push({
      platform: "instagram",
      external_id: externalId,
      url: p.url || `https://www.instagram.com/p/${externalId}/`,
      caption: p.caption?.slice(0, 2000) ?? null,
      hashtag_source: sourceTag,
      hashtags: (p.hashtags || []).map((h) => h.toLowerCase()).slice(0, 50),

      author_username: p.ownerUsername ?? null,
      author_full_name: p.ownerFullName ?? null,
      author_profile_url: p.ownerUsername ? `https://www.instagram.com/${p.ownerUsername}/` : null,
      author_id: p.ownerId ?? null,

      thumbnail_url: p.displayUrl ?? null,
      video_url: p.videoUrl ?? null,
      media_type: mediaType,
      duration_sec: p.videoDuration ?? null,

      views_count: views,
      likes_count: p.likesCount ?? null,
      comments_count: p.commentsCount ?? null,

      posted_at: p.timestamp ?? null,
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      metadata: {
        location: p.locationName,
        is_sponsored: p.isSponsored,
        product_type: p.productType,
        mentions: p.mentions,
      },
    });
  }

  // Sort: video primeiro, depois views desc
  out.sort((a, b) => {
    const va = a.media_type === "video" ? 1 : 0;
    const vb = b.media_type === "video" ? 1 : 0;
    if (va !== vb) return vb - va;
    return (b.views_count ?? 0) - (a.views_count ?? 0);
  });

  return out;
}
