import { NextRequest, NextResponse } from "next/server";
import { savePropertyId, listAccessibleProperties } from "@/lib/ga4/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  propertyId: z.string().regex(/^\d+$/).min(1).max(20),
});

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null, supabase };
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  return { user, role: roleRow?.role || null, supabase };
}

export async function GET() {
  const { user, role } = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!role || !["owner", "head"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const properties = await listAccessibleProperties();
    return NextResponse.json({ properties });
  } catch (e) {
    console.error("[api/ga4/property] list:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, role } = await requireAdmin();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!role || !["owner", "head"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    await savePropertyId(body.propertyId, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/ga4/property] save:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
