import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl, getRedirectUri } from "@/lib/ga4/oauth";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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
