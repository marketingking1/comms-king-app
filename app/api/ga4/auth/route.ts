import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl, getRedirectUri } from "@/lib/ga4/oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Auth — só owner/head pode iniciar OAuth GA4
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!role || !["owner", "head"].includes(role.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = getRedirectUri(request);
  const url = buildAuthUrl(redirectUri, state);

  const response = NextResponse.redirect(url);
  response.cookies.set("ga4_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
