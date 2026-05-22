import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const MIN_TITLE_LEN = 10;

/**
 * Extrai um título humanizado do raw_markdown.
 * Cada match precisa ter pelo menos MIN_TITLE_LEN — evita capturar
 * lixo tipo "# C" ou "Conceito: A".
 */
function extractConceptTitle(raw: string | null): string | null {
  if (!raw || raw.length < MIN_TITLE_LEN) return null;
  const clean = (s: string) => s.replace(/[*_`]+/g, "").trim();

  // H1
  const h1 = raw.match(/^#\s+(.+?)$/m);
  if (h1) {
    const c = clean(h1[1]);
    if (c.length >= MIN_TITLE_LEN) return c.slice(0, 120);
  }
  // H2
  const h2 = raw.match(/^##\s+(.+?)$/m);
  if (h2) {
    const c = clean(h2[1]);
    if (c.length >= MIN_TITLE_LEN) return c.slice(0, 120);
  }
  // Labeled: "Conceito: ..." / "Título: ..." / "Nome: ..."
  const labeled = raw.match(/^(?:Conceito|Título|Nome|Title|Big\s+Idea)[:\s]+(.+?)$/im);
  if (labeled) {
    const c = clean(labeled[1]);
    if (c.length >= MIN_TITLE_LEN) return c.slice(0, 120);
  }
  // Primeira linha boa
  for (const line of raw.split("\n")) {
    const c = line.replace(/[#*_`>\-]+/g, "").trim();
    if (c.length >= MIN_TITLE_LEN && c.length < 200) return c.slice(0, 120);
  }
  return null;
}

function extractConceptSummary(raw: string | null): string | null {
  if (!raw) return null;
  const tese = raw.match(/(?:Tese|Pitch|Resumo|Summary)[:\s]+(.+?)(?:\n|$)/i);
  if (tese) {
    const c = tese[1].replace(/[*_`]+/g, "").trim();
    if (c.length >= 15) return c.slice(0, 200);
  }
  return null;
}

export default async function ConceptsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, narrative_model, hook_verbal, stepps_dominant, status, big_idea_id, raw_markdown, created_at")
    .order("created_at", { ascending: false });

  // Carrega Big Ideas relacionadas pra usar como fallback de título
  const bigIdeaIds = Array.from(new Set((concepts || []).map((c) => c.big_idea_id).filter(Boolean)));
  const ideasMap = new Map<string, string>();
  if (bigIdeaIds.length > 0) {
    const { data: ideas } = await supabase
      .from("big_ideas")
      .select("id, title")
      .in("id", bigIdeaIds);
    for (const i of ideas || []) {
      if (i.title) ideasMap.set(i.id, i.title);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Criação"
        title="Conceitos narrativos"
        description="Hero Brand + 3 Regras + STEPPS — comms-storyteller-viral"
      />

      {!concepts?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-cyan/15 mx-auto flex items-center justify-center">
              <Film className="h-7 w-7 text-brand-cyan" />
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-xl font-semibold">Nenhum conceito ainda</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Aprove uma Big Idea em <Link href="/ideas" className="text-foreground underline underline-offset-4">Big Ideas</Link> pra gerar o conceito narrativo.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 stagger">
          {concepts.map((c, idx) => {
            const total = concepts.length;
            const n = total - idx;
            const parentIdea = c.big_idea_id ? ideasMap.get(c.big_idea_id) : null;

            // Cascata de fallbacks pra nunca mostrar "C" sozinho:
            const extracted = extractConceptTitle(c.raw_markdown);
            const validHook = c.hook_verbal && c.hook_verbal.length >= MIN_TITLE_LEN ? c.hook_verbal : null;
            const validModel = c.narrative_model && c.narrative_model.length >= 4 && c.narrative_model !== "auto" ? c.narrative_model : null;
            const title =
              extracted ||
              validHook ||
              (parentIdea ? `Conceito de "${parentIdea}"` : null) ||
              (validModel ? `Conceito ${validModel}` : null) ||
              `Conceito #${n}`;

            const summary = (validHook && extracted !== validHook ? validHook : null) || extractConceptSummary(c.raw_markdown);
            const showModelBadge = c.narrative_model && c.narrative_model.length >= 4 && c.narrative_model !== "auto";
            const isEmpty = !c.raw_markdown || c.raw_markdown.length < 100;

            return (
              <Link key={c.id} href={`/concepts/${c.id}`} className="group block">
                <Card className="hover:shadow-md hover:border-foreground/15 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-brand-cyan/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Film className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-display text-base font-semibold leading-snug line-clamp-1 mb-0.5">
                        {title}
                      </p>
                      {summary && (
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed mb-1.5">
                          {summary.replace(/[*_`]+/g, "")}
                        </p>
                      )}
                      <div className="flex gap-1.5 flex-wrap">
                        {showModelBadge && (
                          <Badge variant="outline" className="text-[10px] font-medium border-border">
                            {c.narrative_model}
                          </Badge>
                        )}
                        {c.stepps_dominant && (
                          <Badge variant="outline" className="text-[10px] font-medium border-border">
                            STEPPS · {c.stepps_dominant}
                          </Badge>
                        )}
                        {isEmpty && (
                          <Badge variant="outline" className="text-[10px] font-medium bg-amber-500/10 text-amber-700 border-amber-500/30">
                            Sem conteúdo gerado
                          </Badge>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 mt-1" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
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
