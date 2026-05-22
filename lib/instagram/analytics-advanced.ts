/**
 * Análises avançadas — score composto, hook features, theme clustering.
 */

import type { PieceWithInsights } from "./analytics";
import { shareRate, saveRate, engagementRate, profileVisitRate } from "./analytics";

// =========================================================
// SCORE SEMANAL COMPOSTO (0-100)
// =========================================================

export type ScoreBreakdown = {
  total: number;
  components: {
    reachGrowth: number;
    engagementQuality: number;
    profileConversion: number;
    followerVelocity: number;
    contentConsistency: number;
  };
  delta: number; // vs período anterior
};

export function calculateWeeklyScore(
  currentPieces: PieceWithInsights[],
  previousPieces: PieceWithInsights[],
  currentFollowerGrowth: number = 0,
  previousFollowerGrowth: number = 0,
  currentProfileViews: number = 0,
  currentWebsiteClicks: number = 0,
): ScoreBreakdown {
  // Reach growth (0-25 pts)
  const curReach = currentPieces.reduce((s, p) => s + (p.insights.reach || 0), 0);
  const prevReach = previousPieces.reduce((s, p) => s + (p.insights.reach || 0), 0);
  const reachRatio = prevReach > 0 ? curReach / prevReach : 1;
  const reachGrowth = clamp((reachRatio - 0.5) * 25, 0, 25);

  // Engagement quality (0-25 pts)
  const avgEng = currentPieces.length > 0
    ? currentPieces.reduce((s, p) => s + engagementRate(p), 0) / currentPieces.length
    : 0;
  // 5% eng rate = teto
  const engagementQuality = clamp(avgEng * 500, 0, 25);

  // Profile→site conversion (0-20 pts)
  // CTR perfil → bio
  const profileCTR = currentProfileViews > 0 ? currentWebsiteClicks / currentProfileViews : 0;
  // 20% CTR = teto
  const profileConversion = clamp(profileCTR * 100, 0, 20);

  // Follower velocity (0-15 pts)
  const followerVelocity = clamp(
    Math.log10(Math.max(currentFollowerGrowth, 1)) * 7.5,
    0,
    15,
  );

  // Content consistency (0-15 pts) — peças/semana
  // Sweet spot 7-10 peças/semana = 100%
  const piecesPerWeek = (currentPieces.length / 30) * 7;
  let consistencyPts = 0;
  if (piecesPerWeek >= 7 && piecesPerWeek <= 10) consistencyPts = 15;
  else if (piecesPerWeek > 10) consistencyPts = Math.max(15 - (piecesPerWeek - 10), 5);
  else consistencyPts = (piecesPerWeek / 7) * 15;
  const contentConsistency = clamp(consistencyPts, 0, 15);

  const total = Math.round(
    reachGrowth + engagementQuality + profileConversion + followerVelocity + contentConsistency,
  );

  // Delta vs período anterior — proxy simples baseado em reach delta
  const delta = Math.round((reachRatio - 1) * 100);

  return {
    total,
    components: {
      reachGrowth: Math.round(reachGrowth),
      engagementQuality: Math.round(engagementQuality),
      profileConversion: Math.round(profileConversion),
      followerVelocity: Math.round(followerVelocity),
      contentConsistency: Math.round(contentConsistency),
    },
    delta,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// =========================================================
// HOOK FEATURE EXTRACTION (regex baseline — depois LLM)
// =========================================================

export type HookFeatures = {
  firstSentence: string;
  wordCount: number;
  hasQuestion: boolean;
  hasNumber: boolean;
  pronoun: "voce" | "eu" | "nos" | "third_person" | "none";
  startsWithVerb: boolean;
  hasNegation: boolean;
  // Classificação heurística (refinada via LLM no agente inline)
  heuristicType:
    | "curiosity_gap"
    | "contrarian"
    | "stake_reveal"
    | "question"
    | "declaration"
    | "story_in_media_res"
    | "number_promise"
    | "pattern_interrupt"
    | "unknown";
};

export function extractHookFeatures(caption: string): HookFeatures {
  const text = (caption || "").trim();
  const firstSentence = text.split(/[.!?\n]/, 1)[0]?.slice(0, 200) || "";
  const lower = firstSentence.toLowerCase();

  const hasQuestion = /\?/.test(firstSentence) || /^(como|por que|quem|quando|onde|qual|quantos?)\b/i.test(firstSentence);
  const hasNumber = /\d+/.test(firstSentence);
  const hasNegation = /\b(não|nunca|nada|nenhum|sem|jamais)\b/i.test(firstSentence);

  let pronoun: HookFeatures["pronoun"] = "none";
  if (/\bvoc[êe]\b/i.test(firstSentence)) pronoun = "voce";
  else if (/\b(eu|me|meu|minha)\b/i.test(firstSentence)) pronoun = "eu";
  else if (/\b(n[óo]s|nosso|nossa)\b/i.test(firstSentence)) pronoun = "nos";
  else if (/\b(ele|ela|eles|elas|alguém|profissional|gente)\b/i.test(firstSentence)) pronoun = "third_person";

  const verbStarts = /^(pare|comece|imagine|esqueça|aprenda|esquece|olha|saiba|veja|tente|para de|faça)/i;
  const startsWithVerb = verbStarts.test(firstSentence);

  // Heurística de tipo
  let heuristicType: HookFeatures["heuristicType"] = "declaration";
  if (hasQuestion) heuristicType = "question";
  else if (hasNumber && /(?:\d+\s*(?:%|frase|palavra|forma|jeito|coisa|maneira|min|hora|dia|ano))/i.test(firstSentence)) heuristicType = "number_promise";
  else if (hasNegation && /\b(não|nunca|nem)\b/i.test(firstSentence) && lower.length < 100) heuristicType = "contrarian";
  else if (/\bcustou|perdeu|perdi|paguei|paguei|valor|reais|R\$/i.test(firstSentence)) heuristicType = "stake_reveal";
  else if (/\bsegredo|verdade|ninguém te conta|descobri|olha isso\b/i.test(firstSentence)) heuristicType = "curiosity_gap";
  else if (startsWithVerb) heuristicType = "pattern_interrupt";
  else if (/^(era uma vez|eu tinha|ela tinha|ele tinha|naquele dia)/i.test(firstSentence)) heuristicType = "story_in_media_res";

  return {
    firstSentence,
    wordCount: firstSentence.split(/\s+/).length,
    hasQuestion,
    hasNumber,
    pronoun,
    startsWithVerb,
    hasNegation,
    heuristicType,
  };
}

// =========================================================
// THEME CLUSTERING (heurística por palavra-chave)
// =========================================================

export type ThemeCluster = {
  label: string;
  keywords: string[];
  pieces: PieceWithInsights[];
  avgReach: number;
  avgSaveRate: number;
  avgShareRate: number;
  avgEngagementRate: number;
};

// Definição manual de temas — substituir por embedding+UMAP em F3
const THEMES: Array<{ label: string; keywords: RegExp }> = [
  {
    label: "Vergonha / Invisibilidade",
    keywords: /\b(vergonha|trav[ae][rdi]|finge|fingindo|tímido|silêncio|invisível|invisível|escondi[dt]o|escondido)\b/i,
  },
  {
    label: "Vaga / Carreira / Promoção",
    keywords: /\b(vaga|promoção|promoção|aumento|salário|cargo|carreira|empregad[oa]|demit|chefe|gerente|diretor|executivo)\b/i,
  },
  {
    label: "Reunião internacional",
    keywords: /\b(reuni[aã]o|meeting|conference|call|inglês falado|reunião em inglês|cliente gringo|gringo)\b/i,
  },
  {
    label: "Anti-método tradicional",
    keywords: /\b(escola tradicional|gramática|gramatica|decorar|decoreba|gru[pã]ã[oõ]|cursinho)\b/i,
  },
  {
    label: "Anti-app / anti-grátis",
    keywords: /\b(duolingo|grátis|gratis|gratuito|ebook|app de inglês|aplicativo)\b/i,
  },
  {
    label: "Caso de aluno / depoimento",
    keywords: /\b(meu aluno|nossa aluna|conheci|depoimento|aluno King|aluna King|fulano|caso)\b/i,
  },
  {
    label: "Método King / professor particular",
    keywords: /\b(professor particular|nosso método|método King|aulas particulares|4x por semana|aulas 4x)\b/i,
  },
  {
    label: "Morar fora / intercâmbio",
    keywords: /\b(morar fora|intercâmbio|mudar para|EUA|Estados Unidos|Londres|fora do Brasil)\b/i,
  },
  {
    label: "Idade / tarde demais",
    keywords: /\b(velho demais|idade|tarde demais|aos \d+|\d+ anos)\b/i,
  },
  {
    label: "Prova social / 9 mil",
    keywords: /\b(9 mil|nove mil|mais de 9|alunos formados|aprovados)\b/i,
  },
];

export function clusterByTheme(pieces: PieceWithInsights[]): ThemeCluster[] {
  const clusters = new Map<string, PieceWithInsights[]>();
  const unassigned: PieceWithInsights[] = [];

  for (const p of pieces) {
    const caption = p.media.caption || "";
    let assigned = false;
    for (const t of THEMES) {
      if (t.keywords.test(caption)) {
        if (!clusters.has(t.label)) clusters.set(t.label, []);
        clusters.get(t.label)!.push(p);
        assigned = true;
        break; // 1 tema por peça (primeira match)
      }
    }
    if (!assigned) unassigned.push(p);
  }
  if (unassigned.length > 0) clusters.set("Outros / não classificado", unassigned);

  const result: ThemeCluster[] = [];
  for (const [label, items] of clusters) {
    if (items.length === 0) continue;
    const avgReach = items.reduce((a, p) => a + (p.insights.reach || 0), 0) / items.length;
    const avgSave = items.reduce((a, p) => a + saveRate(p), 0) / items.length;
    const avgShare = items.reduce((a, p) => a + shareRate(p), 0) / items.length;
    const avgEng = items.reduce((a, p) => a + engagementRate(p), 0) / items.length;
    const theme = THEMES.find((t) => t.label === label);
    result.push({
      label,
      keywords: theme ? theme.keywords.source.replace(/\\b|\(|\)|\\/g, "").split("|").slice(0, 6) : [],
      pieces: items,
      avgReach,
      avgSaveRate: avgSave,
      avgShareRate: avgShare,
      avgEngagementRate: avgEng,
    });
  }
  return result.sort((a, b) => b.avgReach - a.avgReach);
}

// =========================================================
// CORRELAÇÃO LAGGED (Pearson)
// =========================================================

export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX, dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const denom = Math.sqrt(denX * denY);
  return denom === 0 ? 0 : num / denom;
}

export type LaggedCorrelation = {
  lag: number;
  pearson: number;
  pairs: number;
};

export function correlateLagged(
  x: number[],
  y: number[],
  maxLag = 3,
): LaggedCorrelation[] {
  const results: LaggedCorrelation[] = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    if (lag >= y.length) break;
    const x_lag = x.slice(0, x.length - lag);
    const y_lag = y.slice(lag);
    const minLen = Math.min(x_lag.length, y_lag.length);
    results.push({
      lag,
      pearson: pearsonCorrelation(x_lag.slice(0, minLen), y_lag.slice(0, minLen)),
      pairs: minLen,
    });
  }
  return results;
}

// Helper: cria série temporal de posts/dia
export function buildDailyPostsSeries(pieces: PieceWithInsights[], days: number): { date: string; posts: number }[] {
  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 3600 * 1000);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const p of pieces) {
    const d = p.media.timestamp.slice(0, 10);
    if (map.has(d)) map.set(d, (map.get(d) || 0) + 1);
  }
  return Array.from(map.entries()).map(([date, posts]) => ({ date, posts }));
}
