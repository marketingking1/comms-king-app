import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).max(50000),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

  if (!checkRateLimit(`save-big-idea:${user.id}`, 10, 60)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

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
    console.error("[api/analytics/save-big-idea]", error);
    return Response.json({ error: "insert failed" }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
