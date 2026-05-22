import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getRedirectUri, saveTokens } from "@/lib/ga4/oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const cookieState = request.cookies.get("ga4_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(new URL(`/ga4?error=${encodeURIComponent(error)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/ga4?error=no_code", request.url));
  }
  if (!state || state !== cookieState) {
    return NextResponse.redirect(new URL("/ga4?error=state_mismatch", request.url));
  }

  try {
    const redirectUri = getRedirectUri(request);
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/ga4?error=no_refresh_token", request.url));
    }
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    await saveTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in, user?.id);
    return NextResponse.redirect(new URL("/ga4?connected=1", request.url));
  } catch (e) {
    console.error("[api/ga4/callback]", e);
    return NextResponse.redirect(new URL("/ga4?error=oauth_failed", request.url));
  }
}
