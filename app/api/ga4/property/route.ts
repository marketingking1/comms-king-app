import { NextRequest, NextResponse } from "next/server";
import { savePropertyId, listAccessibleProperties } from "@/lib/ga4/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const properties = await listAccessibleProperties();
    return NextResponse.json({ properties });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  await savePropertyId(String(body.propertyId), user?.id);
  return NextResponse.json({ ok: true });
}
