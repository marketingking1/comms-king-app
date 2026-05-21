/**
 * Google OAuth helpers — fluxo Web pra Google Analytics Data API.
 * Refresh tokens persistidos em comms.integrations (key='ga4_oauth').
 */

import { createSupabaseAdminClient } from "@/lib/supabase/server";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;

export function getRedirectUri(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "comms-king-app.vercel.app";
  return `${proto}://${host}/api/ga4/callback`;
}

export function buildAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/analytics.readonly openid email",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${await res.text()}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${await res.text()}`);
  }
  return res.json();
}

export async function getAccessToken(): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("integrations")
    .select("value, expires_at")
    .eq("key", "ga4_oauth")
    .single();
  if (!data) return null;

  const stored = data.value as { access_token?: string; refresh_token: string };
  const expires = data.expires_at ? new Date(data.expires_at).getTime() : 0;

  // Se access token expira em < 60s, renova
  if (expires - Date.now() < 60000 && stored.refresh_token) {
    const newTokens = await refreshAccessToken(stored.refresh_token);
    const newExpires = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
    await admin
      .from("integrations")
      .update({
        value: {
          access_token: newTokens.access_token,
          refresh_token: stored.refresh_token,
        },
        expires_at: newExpires,
        updated_at: new Date().toISOString(),
      })
      .eq("key", "ga4_oauth");
    return newTokens.access_token;
  }

  return stored.access_token ?? null;
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  userId?: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await admin.from("integrations").upsert(
    {
      key: "ga4_oauth",
      value: { access_token: accessToken, refresh_token: refreshToken },
      expires_at: expiresAt,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
}

export async function clearTokens(): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from("integrations").delete().eq("key", "ga4_oauth");
}
