import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ScriptEditor } from "./editor";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Wand2 } from "lucide-react";

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

  const fmt = (script.format || "—").toString().toUpperCase();
  const dur = script.duration_sec ? `${script.duration_sec}s` : null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-3">
        <Link
          href="/scripts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Roteiros
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-chart-5/15 flex items-center justify-center flex-shrink-0">
              <Wand2 className="h-6 w-6 text-chart-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                Roteiro publicável
              </p>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
                {fmt}
                {dur && <span className="text-muted-foreground font-normal"> · {dur}</span>}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Plataforma: <span className="text-foreground capitalize">{script.platform || "instagram"}</span>
              </p>
            </div>
          </div>
          <StatusBadge status={script.status} />
        </div>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    approved: { label: "Aprovado", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
    draft: { label: "Rascunho", className: "bg-muted text-muted-foreground border-border" },
    rejected: { label: "Rejeitado", className: "bg-destructive/12 text-destructive border-destructive/30" },
  };
  const v = map[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium whitespace-nowrap ${v.className}`}>
      {v.label}
    </Badge>
  );
}
