import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConceptActions } from "./actions";
import { MarkdownProse } from "@/components/markdown-prose";
import { ChevronLeft, Film, Wand2, ArrowUpRight, Sparkles } from "lucide-react";

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: concept } = await supabase
    .from("concepts")
    .select("*")
    .eq("id", id)
    .single();

  if (!concept) notFound();

  const { data: scripts } = await supabase
    .from("scripts")
    .select("id, format, status, created_at")
    .eq("concept_id", id);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-3">
        <Link
          href="/ideas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Big Ideas
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="h-12 w-12 rounded-xl bg-brand-cyan/15 flex items-center justify-center flex-shrink-0">
              <Film className="h-6 w-6 text-brand-cyan" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                Conceito narrativo
              </p>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight leading-tight">
                {concept.narrative_model || "Conceito"}
              </h1>
              {concept.hook_verbal && (
                <p className="text-sm text-muted-foreground mt-1.5">{concept.hook_verbal}</p>
              )}
            </div>
          </div>
          <StatusBadge status={concept.status} />
        </div>
      </div>

      <ConceptActions conceptId={concept.id} bigIdeaId={concept.big_idea_id} />

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-coral" />
            Conceito completo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 lg:p-8">
          {concept.raw_markdown ? (
            <MarkdownProse markdown={concept.raw_markdown} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem conteúdo.</p>
          )}
        </CardContent>
      </Card>

      {scripts && scripts.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-chart-5" />
              Roteiros derivados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {scripts.map((s) => (
              <Link
                key={s.id}
                href={`/scripts/${s.id}`}
                className="group flex items-center gap-3 p-3 rounded-lg border hover:border-foreground/20 hover:bg-accent/30 transition-all cursor-pointer"
              >
                <div className="h-9 w-9 rounded-lg bg-chart-5/15 flex items-center justify-center flex-shrink-0">
                  <Wand2 className="h-4 w-4 text-chart-5" />
                </div>
                <span className="flex-1 font-medium">{s.format || "Roteiro"}</span>
                <StatusBadge status={s.status} />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
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
