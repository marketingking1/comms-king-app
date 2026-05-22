import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Lightbulb, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default async function IdeasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: ideas } = await supabase
    .from("big_ideas")
    .select("id, title, thesis, status, brief_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Estratégia"
        title="Big Ideas"
        description="Teses estratégicas $1M — comms-million-strategist"
      />

      {!ideas?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-coral/12 mx-auto flex items-center justify-center">
              <Lightbulb className="h-7 w-7 text-brand-coral" />
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-xl font-semibold">Nenhuma Big Idea ainda</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Crie um brief em <Link href="/briefs" className="text-foreground underline underline-offset-4">Briefs</Link> e gere 3 Big Ideas a partir dele.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 stagger">
          {ideas.map((idea) => (
            <Link key={idea.id} href={`/ideas/${idea.id}`} className="group block">
              <Card className="hover:shadow-md hover:border-foreground/15 transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-brand-coral/12 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="h-5 w-5 text-brand-coral" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="font-display text-lg font-semibold leading-snug">
                          {idea.title}
                        </p>
                        <StatusBadge status={idea.status} />
                      </div>
                      {idea.thesis && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {idea.thesis}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 mt-1" aria-hidden="true" />
                  </div>
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
    approved: { label: "Aprovada", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
    proposed: { label: "Proposta", className: "bg-brand-blue/12 text-brand-blue border-brand-blue/30" },
    rejected: { label: "Rejeitada", className: "bg-destructive/12 text-destructive border-destructive/30" },
  };
  const v = map[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium whitespace-nowrap ${v.className}`}>
      {v.label}
    </Badge>
  );
}
