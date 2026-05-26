export type BriefingType = "mensal" | "isolado" | "carrossel" | "post" | "trend";

export const BRIEFING_TYPES: BriefingType[] = [
  "mensal",
  "isolado",
  "carrossel",
  "post",
  "trend",
];

export const BRIEFING_TYPE_LABELS: Record<BriefingType, string> = {
  mensal: "Brief mensal",
  isolado: "Conteúdo isolado",
  carrossel: "Carrossel",
  post: "Post (Reel)",
  trend: "Trend",
};

export const BRIEFING_TYPE_DESCRIPTIONS: Record<BriefingType, string> = {
  mensal: "Diagnóstico estratégico do mês · pilares + posicionamento + Big Ideas",
  isolado: "Peça avulsa (stories, bastidor, pontual) · sem precisar de brief mensal",
  carrossel: "Carrossel educativo IG/LinkedIn · 6-10 slides",
  post: "Reel 15-30s · gancho rápido publicável",
  trend: "Zeitgeist fast-track (≤48h) · partir de trend detectada",
};

export type DownstreamAction = {
  agent: "comms-million-strategist" | "comms-scriptwriter";
  label: string;
  fastTrack: boolean;
  /** sufixo lido pela UI pra montar o ícone */
  ctaIcon: "ideas" | "script" | "fasttrack";
};

export function downstreamAgent(type: BriefingType): DownstreamAction {
  switch (type) {
    case "mensal":
      return {
        agent: "comms-million-strategist",
        label: "Gerar 3 Big Ideas",
        fastTrack: false,
        ctaIcon: "ideas",
      };
    case "trend":
      return {
        agent: "comms-scriptwriter",
        label: "Fast-track roteiro",
        fastTrack: true,
        ctaIcon: "fasttrack",
      };
    case "isolado":
    case "carrossel":
    case "post":
      return {
        agent: "comms-scriptwriter",
        label: "Gerar roteiro",
        fastTrack: false,
        ctaIcon: "script",
      };
  }
}

export function isBriefingType(s: unknown): s is BriefingType {
  return typeof s === "string" && (BRIEFING_TYPES as string[]).includes(s);
}
