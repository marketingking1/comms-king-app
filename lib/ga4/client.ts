/**
 * Cliente GA4 Data API — runReport.
 * Property ID persistido em comms.integrations (key='ga4_property_id').
 */

import { getAccessToken } from "./oauth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const API = "https://analyticsdata.googleapis.com/v1beta";

export async function getPropertyId(): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("integrations")
    .select("value")
    .eq("key", "ga4_property_id")
    .single();
  if (!data) return null;
  return (data.value as { id: string }).id;
}

export async function savePropertyId(propertyId: string, userId?: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from("integrations").upsert(
    {
      key: "ga4_property_id",
      value: { id: propertyId },
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
}

type RunReportInput = {
  dateRanges: Array<{ startDate: string; endDate: string; name?: string }>;
  dimensions?: Array<{ name: string }>;
  metrics: Array<{ name: string; expression?: string }>;
  dimensionFilter?: object;
  metricFilter?: object;
  orderBys?: Array<{ metric?: { metricName: string }; dimension?: { dimensionName: string }; desc?: boolean }>;
  limit?: string;
  offset?: string;
};

type RunReportResponse = {
  rows?: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
  rowCount?: number;
  totals?: Array<{ metricValues: Array<{ value: string }> }>;
};

export async function runReport(input: RunReportInput): Promise<RunReportResponse> {
  const token = await getAccessToken();
  const propertyId = await getPropertyId();
  if (!token) throw new Error("GA4 não conectado");
  if (!propertyId) throw new Error("GA4 property ID não configurado");

  const res = await fetch(`${API}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`GA4 ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function listAccessibleProperties(): Promise<
  Array<{ name: string; displayName: string; account: string }>
> {
  const token = await getAccessToken();
  if (!token) throw new Error("GA4 não conectado");

  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!res.ok) throw new Error(`Admin API ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as {
    accountSummaries?: Array<{
      displayName: string;
      propertySummaries?: Array<{ property: string; displayName: string }>;
    }>;
  };

  const out: Array<{ name: string; displayName: string; account: string }> = [];
  for (const acc of data.accountSummaries || []) {
    for (const prop of acc.propertySummaries || []) {
      out.push({
        name: prop.property.replace("properties/", ""),
        displayName: prop.displayName,
        account: acc.displayName,
      });
    }
  }
  return out;
}

// =====================================================
// Reports específicos pro comms-king
// =====================================================

const DEFAULT_RANGE_DAYS = 30;

function dateRange(days = DEFAULT_RANGE_DAYS) {
  return [
    { startDate: `${days}daysAgo`, endDate: "today", name: "current" },
  ];
}

/**
 * Tráfego orgânico do Instagram nos últimos N dias.
 * Filtra por sessionSource contendo "instagram" OU sessionMedium contendo "social".
 */
export async function getInstagramOrganicTraffic(days = DEFAULT_RANGE_DAYS) {
  return runReport({
    dateRanges: dateRange(days),
    dimensions: [{ name: "date" }, { name: "sessionSourceMedium" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "engagedSessions" },
      { name: "averageSessionDuration" },
    ],
    dimensionFilter: {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: "sessionSource",
              stringFilter: { matchType: "CONTAINS", value: "instagram", caseSensitive: false },
            },
          },
          {
            filter: {
              fieldName: "sessionSource",
              stringFilter: { matchType: "CONTAINS", value: "ig", caseSensitive: false },
            },
          },
        ],
      },
    },
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: "1000",
  });
}

/**
 * Top influenciadores — tráfego com utm_medium contendo "influencer" OU
 * utm_source de pessoas (sem ser plataforma).
 */
export async function getInfluencerTraffic(days = DEFAULT_RANGE_DAYS) {
  return runReport({
    dateRanges: dateRange(days),
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }, { name: "sessionCampaignName" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "engagedSessions" },
      { name: "conversions" },
    ],
    dimensionFilter: {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: "sessionMedium",
              stringFilter: { matchType: "CONTAINS", value: "influencer", caseSensitive: false },
            },
          },
          {
            filter: {
              fieldName: "sessionMedium",
              stringFilter: { matchType: "CONTAINS", value: "creator", caseSensitive: false },
            },
          },
          {
            filter: {
              fieldName: "sessionCampaignName",
              stringFilter: { matchType: "CONTAINS", value: "influ", caseSensitive: false },
            },
          },
          {
            filter: {
              fieldName: "sessionMedium",
              stringFilter: { matchType: "EXACT", value: "referral", caseSensitive: false },
            },
          },
        ],
      },
    },
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: "50",
  });
}

/**
 * Top campanhas UTM no período (qualquer source).
 */
export async function getTopCampaigns(days = DEFAULT_RANGE_DAYS) {
  return runReport({
    dateRanges: dateRange(days),
    dimensions: [{ name: "sessionCampaignName" }, { name: "sessionSourceMedium" }],
    metrics: [
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "conversions" },
    ],
    dimensionFilter: {
      notExpression: {
        filter: {
          fieldName: "sessionCampaignName",
          stringFilter: { matchType: "EXACT", value: "(not set)" },
        },
      },
    },
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: "30",
  });
}

/**
 * Overview de tráfego — comparação por source/medium agregado.
 */
export async function getTrafficOverview(days = DEFAULT_RANGE_DAYS) {
  return runReport({
    dateRanges: dateRange(days),
    dimensions: [{ name: "sessionSourceMedium" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "engagedSessions" },
      { name: "averageSessionDuration" },
      { name: "conversions" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: "20",
  });
}
