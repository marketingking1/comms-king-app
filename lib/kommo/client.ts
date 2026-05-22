/**
 * Cliente Kommo CRM (REST v4).
 */

const SUBDOMAIN = process.env.KOMMO_SUBDOMAIN!;
const TOKEN = process.env.KOMMO_TOKEN!;
const BASE = `https://${SUBDOMAIN}.kommo.com/api/v4`;

async function kommoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kommo ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// =========================================================
// CONSTANTES — IDs do account king
// =========================================================

export const KOMMO_PIPELINES = {
  funil_vendas: 6919767,        // Funil de vendas principal
  social_selling: 13461219,     // Social Selling — leads orgânicos sociais
  leads_frios: 9618172,
  repescagem: 12815475,
  ex_alunos: 12816991,
  interno: 12839115,
  funil_mkt_teste: 13468399,
  professorvendedor: 13669515,
};

export const KOMMO_CUSTOM_FIELDS = {
  utm_source: 1001932,
  utm_medium: 1001928,
  utm_campaign: 1001930,
  utm_content: 1001926,
  utm_term: 1001934,
  utm_referrer: 1001936,
  referrer: 1001938,
};

// IDs canônicos de tags
export const KOMMO_TAGS = {
  organico_insta: 129013,    // "Orgânico Insta" — pega de TODOS os pipelines
  lead_organico: 113025,
  insta: 127039,
  social_selling: 127835,
};

// IDs canônicos de status — won = 142 / lost = 143 em todos pipelines
export const STATUS_WON = 142;
export const STATUS_LOST = 143;

// =========================================================
// TIPOS
// =========================================================

export type KommoLead = {
  id: number;
  name: string;
  price: number;
  responsible_user_id: number;
  status_id: number;
  pipeline_id: number;
  created_at: number;   // epoch seconds
  updated_at: number;
  closed_at?: number | null;
  custom_fields_values?: Array<{
    field_id: number;
    field_name: string;
    values: Array<{ value: string | number }>;
  }> | null;
  _embedded?: {
    tags?: Array<{ id: number; name: string; color?: string }>;
  };
};

export type Pipeline = {
  id: number;
  name: string;
  is_archive: boolean;
  _embedded: { statuses: Array<{ id: number; name: string; sort: number; color?: string }> };
};

export type User = {
  id: number;
  name: string;
  email: string;
};

// =========================================================
// QUERIES
// =========================================================

export async function listPipelines(): Promise<Pipeline[]> {
  const r = await kommoFetch<{ _embedded: { pipelines: Pipeline[] } }>(`/leads/pipelines`);
  return r._embedded.pipelines;
}

export async function listUsers(): Promise<User[]> {
  const r = await kommoFetch<{ _embedded: { users: User[] } }>(`/users?limit=250`);
  return r._embedded.users;
}

/**
 * Lista leads com paginação. Retorna até `maxItems`.
 * Filtros úteis: createdAfter, pipelineId, statusId.
 */
/**
 * Lista leads. IMPORTANTE: filter[tags] é silenciosamente ignorado pela API Kommo v4.
 * Use `withTags: true` pra trazer _embedded.tags e filtrar client-side via filterTagIds.
 */
export async function listLeads(opts: {
  createdAfter?: number;
  createdBefore?: number;
  pipelineId?: number;
  statusId?: number;
  filterTagIds?: number[];     // filtra CLIENT-SIDE por OR — pelo menos 1 tag id presente
  withTags?: boolean;          // pede _embedded.tags na resposta
  maxItems?: number;
} = {}): Promise<KommoLead[]> {
  const max = opts.maxItems ?? 1000;
  const all: KommoLead[] = [];
  let page = 1;
  const limit = 250;
  const needsTags = opts.withTags || (opts.filterTagIds && opts.filterTagIds.length > 0);

  while (all.length < max) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("page", String(page));
    if (needsTags) params.set("with", "tags");
    if (opts.createdAfter) {
      params.set("filter[created_at][from]", String(opts.createdAfter));
    }
    if (opts.createdBefore) {
      params.set("filter[created_at][to]", String(opts.createdBefore));
    }
    if (opts.pipelineId) {
      params.set("filter[pipeline_id]", String(opts.pipelineId));
    }
    if (opts.statusId) {
      params.set("filter[statuses][0][pipeline_id]", String(opts.pipelineId ?? KOMMO_PIPELINES.funil_vendas));
      params.set("filter[statuses][0][status_id]", String(opts.statusId));
    }

    try {
      const r = await kommoFetch<{
        _embedded: { leads: KommoLead[] };
        _links: { next?: { href: string } };
      }>(`/leads?${params}`);
      const batch = r._embedded?.leads || [];
      all.push(...batch);
      if (batch.length < limit) break;
      page++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("204")) break; // sem mais resultados
      throw e;
    }
  }

  let result = all.slice(0, max);

  // Filtro client-side por tags (Kommo v4 ignora filter[tags] no server)
  if (opts.filterTagIds && opts.filterTagIds.length > 0) {
    const tagSet = new Set(opts.filterTagIds);
    result = result.filter((l) => {
      const tags = l._embedded?.tags || [];
      return tags.some((t) => tagSet.has(t.id));
    });
  }

  return result;
}
