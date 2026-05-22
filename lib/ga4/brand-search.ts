/**
 * Brand search queries via GSC + GA4 — bridge orgânico→busca.
 */

import { runReport } from "./client";

export type DailySearchPoint = {
  date: string;        // YYYY-MM-DD
  sessions: number;
  searches?: number;   // GSC opcional, hoje só GA4
};

/**
 * GA4: tráfego direct + branded social-organic agregado por dia.
 * Proxy: "tráfego direto" geralmente indica busca pela marca (Google → site).
 */
export async function getBrandTrafficDaily(days = 30): Promise<DailySearchPoint[]> {
  const report = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
    dimensionFilter: {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: "sessionMedium",
              stringFilter: { matchType: "EXACT", value: "(none)" },
            },
          },
          {
            filter: {
              fieldName: "sessionDefaultChannelGroup",
              stringFilter: { matchType: "EXACT", value: "Direct" },
            },
          },
          {
            filter: {
              fieldName: "sessionSource",
              stringFilter: { matchType: "CONTAINS", value: "google", caseSensitive: false },
            },
          },
        ],
      },
    },
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: "100",
  });

  return (report.rows || []).map((r) => {
    const raw = r.dimensionValues[0].value; // YYYYMMDD
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    return { date, sessions: Number(r.metricValues[0].value) };
  });
}

/**
 * GA4: específico "brand search" — sessões com keyword da marca.
 * GA4 não dá keyword direto (privacidade Google) mas dá "google / organic"
 * que é proxy aceitável.
 */
export async function getOrganicSearchDaily(days = 30): Promise<DailySearchPoint[]> {
  const report = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: "sessionSource",
              stringFilter: { matchType: "EXACT", value: "google", caseSensitive: false },
            },
          },
          {
            filter: {
              fieldName: "sessionMedium",
              stringFilter: { matchType: "EXACT", value: "organic" },
            },
          },
        ],
      },
    },
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: "100",
  });

  return (report.rows || []).map((r) => {
    const raw = r.dimensionValues[0].value;
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    return { date, sessions: Number(r.metricValues[0].value) };
  });
}
