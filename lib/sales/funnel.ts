/**
 * Funil orgânico cruzado: IG Graph + Kommo + GA4.
 */

import type { KommoLead, Pipeline, User } from "@/lib/kommo/client";
import { KOMMO_CUSTOM_FIELDS, KOMMO_PIPELINES, STATUS_LOST, STATUS_WON } from "@/lib/kommo/client";

// =========================================================
// CLASSIFICAÇÃO DE LEAD POR ORIGEM
// =========================================================

export type LeadSource = "instagram_organic" | "instagram_paid" | "google" | "linkedin" | "other" | "unknown";

export function classifyLeadSource(lead: KommoLead): LeadSource {
  // Heurística baseada em pipeline + UTMs + nome
  const fields = lead.custom_fields_values || [];
  const utmSource = getField(fields, KOMMO_CUSTOM_FIELDS.utm_source);
  const utmMedium = getField(fields, KOMMO_CUSTOM_FIELDS.utm_medium);
  const referrer = getField(fields, KOMMO_CUSTOM_FIELDS.referrer) || getField(fields, KOMMO_CUSTOM_FIELDS.utm_referrer);

  const blob = `${utmSource} ${utmMedium} ${referrer}`.toLowerCase();

  // Pipeline Social Selling → quase sempre orgânico
  if (lead.pipeline_id === KOMMO_PIPELINES.social_selling) return "instagram_organic";

  // UTM source contém "instagram" e medium não é "paid_social|cpc|ads"
  if (blob.includes("instagram") || blob.includes("ig")) {
    if (blob.includes("paid") || blob.includes("cpc") || blob.includes("ads") || blob.includes("ad")) {
      return "instagram_paid";
    }
    return "instagram_organic";
  }
  if (blob.includes("l.instagram")) return "instagram_organic";

  if (blob.includes("google") || blob.includes("g_ads") || blob.includes("gclid")) return "google";
  if (blob.includes("linkedin")) return "linkedin";

  if (blob.trim().length === 0) return "unknown";
  return "other";
}

function getField(
  fields: NonNullable<KommoLead["custom_fields_values"]>,
  fieldId: number,
): string {
  const f = fields.find((x) => x.field_id === fieldId);
  if (!f) return "";
  return String(f.values?.[0]?.value || "");
}

// =========================================================
// ANÁLISES DO FUNIL
// =========================================================

export type FunnelStats = {
  total: number;
  won: number;
  lost: number;
  open: number;
  totalRevenue: number;
  avgTicket: number;
  conversionRate: number;     // won / total
  lossRate: number;           // lost / total
};

export function calcFunnelStats(leads: KommoLead[]): FunnelStats {
  const total = leads.length;
  const won = leads.filter((l) => l.status_id === STATUS_WON).length;
  const lost = leads.filter((l) => l.status_id === STATUS_LOST).length;
  const open = total - won - lost;
  const totalRevenue = leads
    .filter((l) => l.status_id === STATUS_WON)
    .reduce((s, l) => s + (Number(l.price) || 0), 0);

  return {
    total,
    won,
    lost,
    open,
    totalRevenue,
    avgTicket: won > 0 ? totalRevenue / won : 0,
    conversionRate: total > 0 ? won / total : 0,
    lossRate: total > 0 ? lost / total : 0,
  };
}

export type StatusBucket = {
  statusId: number;
  statusName: string;
  count: number;
  totalValue: number;
  avgAgeDays: number;
  color?: string;
};

export function statsByStatus(leads: KommoLead[], pipeline: Pipeline): StatusBucket[] {
  const statusMap = new Map<number, { name: string; color?: string; sort: number }>();
  for (const s of pipeline._embedded.statuses) {
    statusMap.set(s.id, { name: s.name, color: s.color, sort: s.sort });
  }
  const buckets = new Map<number, KommoLead[]>();
  for (const l of leads) {
    if (!buckets.has(l.status_id)) buckets.set(l.status_id, []);
    buckets.get(l.status_id)!.push(l);
  }

  const now = Date.now();
  const result: StatusBucket[] = [];
  for (const [statusId, items] of buckets) {
    const meta = statusMap.get(statusId);
    const ageDaySum = items.reduce(
      (s, l) => s + (now - l.created_at * 1000) / (24 * 3600 * 1000),
      0,
    );
    result.push({
      statusId,
      statusName: meta?.name || `Status ${statusId}`,
      color: meta?.color,
      count: items.length,
      totalValue: items.reduce((s, l) => s + (l.price || 0), 0),
      avgAgeDays: items.length > 0 ? ageDaySum / items.length : 0,
    });
  }
  return result.sort((a, b) => {
    const sa = statusMap.get(a.statusId)?.sort || 999999;
    const sb = statusMap.get(b.statusId)?.sort || 999999;
    return sa - sb;
  });
}

export type SellerStat = {
  userId: number;
  userName: string;
  leads: number;
  won: number;
  lost: number;
  revenue: number;
  conversionRate: number;
};

export function statsBySeller(leads: KommoLead[], users: User[]): SellerStat[] {
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const map = new Map<number, KommoLead[]>();
  for (const l of leads) {
    if (!map.has(l.responsible_user_id)) map.set(l.responsible_user_id, []);
    map.get(l.responsible_user_id)!.push(l);
  }
  return Array.from(map.entries())
    .map(([uid, items]) => {
      const won = items.filter((l) => l.status_id === STATUS_WON);
      return {
        userId: uid,
        userName: userMap.get(uid) || `User ${uid}`,
        leads: items.length,
        won: won.length,
        lost: items.filter((l) => l.status_id === STATUS_LOST).length,
        revenue: won.reduce((s, l) => s + (Number(l.price) || 0), 0),
        conversionRate: items.length > 0 ? won.length / items.length : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

// =========================================================
// DAILY SERIES
// =========================================================

export function dailyLeadsTimeline(leads: KommoLead[], days = 30): Array<{ date: string; total: number; won: number }> {
  const map = new Map<string, { total: number; won: number }>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    map.set(d.toISOString().slice(0, 10), { total: 0, won: 0 });
  }
  for (const l of leads) {
    const day = new Date(l.created_at * 1000).toISOString().slice(0, 10);
    const cur = map.get(day);
    if (!cur) continue;
    cur.total += 1;
    if (l.status_id === STATUS_WON) cur.won += 1;
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

export function pearson(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

// =========================================================
// TEMPO NO FUNIL (cycle time)
// =========================================================

export type CycleTime = {
  avgDaysToWon: number;
  avgDaysToLost: number;
  medianDaysToWon: number;
};

export function calcCycleTime(leads: KommoLead[]): CycleTime {
  const wonDays: number[] = [];
  const lostDays: number[] = [];
  for (const l of leads) {
    if (!l.closed_at) continue;
    const days = (l.closed_at - l.created_at) / (24 * 3600);
    if (l.status_id === STATUS_WON) wonDays.push(days);
    else if (l.status_id === STATUS_LOST) lostDays.push(days);
  }
  function avg(arr: number[]) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
  function median(arr: number[]) {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  return {
    avgDaysToWon: avg(wonDays),
    avgDaysToLost: avg(lostDays),
    medianDaysToWon: median(wonDays),
  };
}
