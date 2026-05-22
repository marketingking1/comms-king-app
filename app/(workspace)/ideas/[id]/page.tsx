import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IdeaActions } from "./actions";
import { MarkdownProse } from "@/components/markdown-prose";
import { ChevronLeft, Lightbulb, Film, ArrowUpRight, Sparkles } from "lucide-react";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: idea } = await supabase
    .from("big_ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (!idea) notFound();

  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, narrative_model, status, created_at")
    .eq("big_idea_id", id);

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
            <div className="h-12 w-12 rounded-xl bg-brand-coral/12 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-6 w-6 text-brand-coral" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                Big Idea
              </p>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight leading-tight">
                {idea.title}
              </h1>
            </div>
          </div>
          <StatusBadge status={idea.status} />
        </div>
      </div>

      {idea.status !== "rejected" && (
        <IdeaActions ideaId={idea.id} status={idea.status} />
      )}

      {idea.thesis && (
        <Card className="border-l-4 border-l-brand-coral">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Tese
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-foreground/90 font-medium">
              {idea.thesis}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-coral" />
            Big Idea completa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 lg:p-8">
          {idea.raw_markdown ? (
            <MarkdownProse markdown={idea.raw_markdown} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem conteúdo.</p>
          )}
        </CardContent>
      </Card>

      {concepts && concepts.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="h-4 w-4 text-brand-cyan" />
              Conceitos gerados desta Big Idea
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {concepts.map((c) => (
              <Link
                key={c.id}
                href={`/concepts/${c.id}`}
                className="group flex items-center gap-3 p-3 rounded-lg border hover:border-foreground/20 hover:bg-accent/30 transition-all cursor-pointer"
              >
                <div className="h-9 w-9 rounded-lg bg-brand-cyan/15 flex items-center justify-center flex-shrink-0">
                  <Film className="h-4 w-4 text-brand-cyan" />
                </div>
                <span className="flex-1 font-medium">{c.narrative_model || "Conceito"}</span>
                <StatusBadge status={c.status} />
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
    approved: { label: "Aprovada", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
    proposed: { label: "Proposta", className: "bg-brand-blue/12 text-brand-blue border-brand-blue/30" },
    draft: { label: "Rascunho", className: "bg-muted text-muted-foreground border-border" },
    rejected: { label: "Rejeitada", className: "bg-destructive/12 text-destructive border-destructive/30" },
  };
  const v = map[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium whitespace-nowrap ${v.className}`}>
      {v.label}
    </Badge>
  );
}
