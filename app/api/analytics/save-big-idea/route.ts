import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("big_ideas")
    .insert({
      title: body.title || "Big Idea (Analytics Lab)",
      raw_markdown: body.content,
      status: "proposed",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
