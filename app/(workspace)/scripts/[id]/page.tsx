import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ScriptEditor } from "./editor";

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: script } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", id)
    .single();

  if (!script) notFound();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/scripts" className="hover:underline">Roteiros</Link> /
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Roteiro · {script.format || "—"} · {script.duration_sec || 0}s
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plataforma: {script.platform || "instagram"} · Status: {script.status}
        </p>
      </div>

      <ScriptEditor
        scriptId={script.id}
        initialRichContent={script.rich_content ? JSON.stringify(script.rich_content) : undefined}
        initialMarkdown={script.raw_markdown || ""}
        initialCaption={script.caption || ""}
        initialHashtags={(script.hashtags || []).join(" ")}
      />
    </div>
  );
}
