import type { BriefingType } from "./routing";

export const TOM_OPTIONS = [
  { value: "auto", label: "Decida você (padrão)" },
  { value: "provocador-direto", label: "Provocador-direto" },
  { value: "storyteller", label: "Storyteller" },
  { value: "didatico-energetico", label: "Didático-energético" },
  { value: "empatico", label: "Empático" },
  { value: "bater-no-inimigo", label: "Bater no inimigo" },
  { value: "acolhedor", label: "Acolhedor" },
] as const;

export const PERSONA_OPTIONS = [
  { value: "auto", label: "Decida você (padrão)" },
  { value: "marcelo-silva", label: "Marcelo Silva (35a, gerente, CLT)" },
  { value: "marcelo-promovido", label: "Marcelo pós-promoção (sob pressão)" },
  { value: "marcelo-empreendedor", label: "Marcelo empreendedor / sócio" },
  { value: "marcelo-mae", label: "Marcelo-mãe (preocupada com filho)" },
  { value: "marcelo-tentei-e-falhei", label: "Já tentou e desistiu" },
] as const;

export const COMPORTAMENTO_OPTIONS = [
  { value: "save", label: "Save (utilidade percebida)" },
  { value: "share", label: "Share (identificação social)" },
  { value: "comment", label: "Comment (debate)" },
  { value: "dm", label: "DM (curiosidade fundo)" },
  { value: "follow", label: "Follow (autoridade)" },
  { value: "link", label: "Click no link (conversão)" },
] as const;

export type TomValue = (typeof TOM_OPTIONS)[number]["value"];
export type PersonaValue = (typeof PERSONA_OPTIONS)[number]["value"];
export type ComportamentoValue = (typeof COMPORTAMENTO_OPTIONS)[number]["value"];

/** Hint de prompt por tipo — alimenta o scriptwriter na fase downstream. */
export const SCRIPT_PROMPT_HINTS: Partial<Record<BriefingType, string>> = {
  post: "Template Reels (15-30s). Vertical 9:16. Hook 1.5s. Tabela tempo|áudio|visual|on-screen|nota. Caption ≤125 char na linha 1. Hashtags 8-15.",
  carrossel:
    "Template Carrossel (6-10 slides). Capa gancho · tese · 3-5 beats · ponto de virada · pergunta engajamento. Caption + hashtags.",
  isolado:
    "Template Stories (sequência 3-7) OU single-piece avulsa. Definir sticker (poll/quiz/question/countdown/link) por story se for sequência. Objetivo de comportamento claro.",
  trend:
    "FAST-TRACK ≤48h. Hero Brand simplificado. Hook 1.5s pesado. Compliance KoL obrigatório (+9 mil · até 12 meses · nada de 'fluência/fluente' como promessa).",
};

/** Formato salvo na tabela comms.scripts pra cada tipo. */
export const SCRIPT_FORMAT_BY_TYPE: Partial<Record<BriefingType, { format: string; duration: number | null; platform: string }>> = {
  post: { format: "reels", duration: 30, platform: "instagram" },
  carrossel: { format: "carrossel", duration: null, platform: "instagram" },
  isolado: { format: "stories", duration: null, platform: "instagram" },
  trend: { format: "reels", duration: 30, platform: "instagram" },
};
