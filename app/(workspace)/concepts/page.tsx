import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default async function ConceptsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, narrative_model, hook_verbal, stepps_dominant, status, big_idea_id, created_at")
    .order("created_at", { ascending: false });

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
        <div className="grid gap-3 stagger">
          {concepts.map((c) => (
            <Link key={c.id} href={`/concepts/${c.id}`} className="group block">
              <Card className="hover:shadow-md hover:border-foreground/15 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-brand-cyan/15 flex items-center justify-center flex-shrink-0">
                    <Film className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base font-semibold leading-tight mb-1.5 truncate">
                      {c.hook_verbal || c.narrative_model || "Conceito"}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {c.narrative_model && (
                        <Badge variant="outline" className="text-[10px] font-medium border-border">
                          {c.narrative_model}
                        </Badge>
                      )}
                      {c.stepps_dominant && (
                        <Badge variant="outline" className="text-[10px] font-medium border-border">
                          STEPPS: {c.stepps_dominant}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
                </CardContent>
              </Card>
            </Link>
          ))}
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
