import { NextResponse } from "next/server";
import { clearTokens } from "@/lib/ga4/oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Disconnect GA4 só owner/head
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!role || !["owner", "head"].includes(role.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await clearTokens();
  return NextResponse.json({ ok: true });
}
