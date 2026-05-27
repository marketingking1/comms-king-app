import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  videoId: z.string().uuid(),
  status: z.enum(["commented", "skipped", "new"]),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

  if (!checkRateLimit(`viral-mark:${user.id}`, 60, 60)) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const patch =
    body.status === "commented"
      ? { status: "commented", commented_at: new Date().toISOString(), commented_by: user.id }
      : body.status === "skipped"
        ? { status: "skipped", commented_at: null, commented_by: null }
        : { status: "new", commented_at: null, commented_by: null };

  const { error } = await supabase
    .from("viral_videos")
    .update(patch)
    .eq("id", body.videoId);

  if (error) {
    console.error("[api/viral/mark]", error);
    return Response.json({ error: "update failed", message: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
