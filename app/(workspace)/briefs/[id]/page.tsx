import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GenerateDownstreamButton } from "./generate-button";
import { MarkdownProse } from "@/components/markdown-prose";
import { ChevronLeft, FileText, Lightbulb, Sparkles, Zap, Layers, Film, Image as ImageIcon } from "lucide-react";
import {
  BRIEFING_TYPE_LABELS,
  isBriefingType,
  type BriefingType,
} from "@/lib/briefs/routing";

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: brief } = await supabase
    .from("briefs")
    .select("*")
    .eq("id", id)
    .single();

  if (!brief) notFound();

  const briefingType: BriefingType = isBriefingType(brief.briefing_type)
    ? brief.briefing_type
    : "mensal";

  const { data: ideas } = await supabase
    .from("big_ideas")
    .select("id, title, status, created_at")
    .eq("brief_id", id)
    .order("created_at", { ascending: false });

  const showBigIdeas = briefingType === "mensal";
  const HeaderIcon = headerIconFor(briefingType);
  const headerTitle = brief.month ?? BRIEFING_TYPE_LABELS[briefingType];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb + Header */}
      <div className="space-y-3">
        <Link
          href="/briefs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Briefs
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <HeaderIcon className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                Brief · {BRIEFING_TYPE_LABELS[briefingType]}
              </p>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
                {headerTitle}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TypeBadge type={briefingType} />
            <StatusBadge status={brief.status} />
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-coral" />
            {showBigIdeas ? "Documento do brief" : "Mini-brief"}
          </CardTitle>
          {!showBigIdeas && (
            <GenerateDownstreamButton
              briefId={brief.id}
              briefMarkdown={brief.raw_markdown || ""}
              briefingType={briefingType}
            />
          )}
        </CardHeader>
        <CardContent className="p-6 lg:p-8">
          {brief.raw_markdown ? (
            <MarkdownProse markdown={brief.raw_markdown} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Brief sem conteúdo.</p>
          )}
        </CardContent>
      </Card>

      {/* Big Ideas — apenas para tipo mensal */}
      {showBigIdeas && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-brand-coral" />
                <CardTitle className="text-base">Big Ideas desse brief</CardTitle>
              </div>
              <GenerateDownstreamButton
                briefId={brief.id}
                briefMarkdown={brief.raw_markdown || ""}
                briefingType={briefingType}
              />
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {!ideas?.length ? (
              <div className="text-center py-12 space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-brand-coral/10 mx-auto flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-brand-coral" />
                </div>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Nenhuma Big Idea ainda. Clique em <strong className="text-foreground">Gerar 3 Big Ideas</strong> pra rodar o <code className="bg-muted px-1.5 py-0.5 rounded text-xs">comms-million-strategist</code>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ideas.map((i) => (
                  <Link
                    key={i.id}
                    href={`/ideas/${i.id}`}
                    className={buttonVariants({
                      variant: "ghost",
                      className: "w-full justify-between !h-auto !p-4 hover:bg-accent/40 cursor-pointer",
                    })}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-brand-coral/12 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="h-4 w-4 text-brand-coral" />
                      </div>
                      <p className="font-medium truncate">{i.title}</p>
                    </div>
                    <StatusBadge status={i.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function headerIconFor(type: BriefingType) {
  switch (type) {
    case "mensal":
      return FileText;
    case "isolado":
      return ImageIcon;
    case "carrossel":
      return Layers;
    case "post":
      return Film;
    case "trend":
      return Zap;
  }
}

function TypeBadge({ type }: { type: BriefingType }) {
  const map: Record<BriefingType, string> = {
    mensal: "bg-brand-blue/12 text-brand-blue border-brand-blue/30",
    isolado: "bg-muted text-muted-foreground border-border",
    carrossel: "bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/30",
    post: "bg-pink-500/12 text-pink-700 dark:text-pink-300 border-pink-500/30",
    trend: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-medium ${map[type]}`}
    >
      {BRIEFING_TYPE_LABELS[type]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    approved: { label: "Aprovado", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
    proposed: { label: "Proposta", className: "bg-brand-blue/12 text-brand-blue border-brand-blue/30" },
    draft: { label: "Rascunho", className: "bg-muted text-muted-foreground border-border" },
    rejected: { label: "Rejeitado", className: "bg-destructive/12 text-destructive border-destructive/30" },
    archived: { label: "Arquivado", className: "bg-muted/60 text-muted-foreground/70 border-border" },
  };
  const v = map[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${v.className}`}>
      {v.label}
    </Badge>
  );
}
