import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default async function BriefsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: briefs } = await supabase
    .from("briefs")
    .select("id, month, status, obsession_metric, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Estratégia"
        title="Briefs"
        description="Briefs estratégicos mensais — comms-head"
        actions={
          <Link
            href="/briefs/new"
            className={buttonVariants({ className: "rounded-full cursor-pointer" })}
          >
            <Plus className="h-4 w-4" />
            Novo brief
          </Link>
        }
      />

      {!briefs?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 mx-auto flex items-center justify-center">
              <FileText className="h-7 w-7 text-brand-blue" />
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-xl font-semibold">Nenhum brief ainda</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Comece o diagnóstico mensal com a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">comms-head</code> — ela vai te questionar antes de aprovar.
              </p>
            </div>
            <Link href="/briefs/new" className={`${buttonVariants({ className: "rounded-full cursor-pointer" })} mt-2`}>
              <Plus className="h-4 w-4" />
              Criar o primeiro
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 stagger">
          {briefs.map((b) => (
            <Link key={b.id} href={`/briefs/${b.id}`} className="group block">
              <Card className="hover:shadow-md hover:border-foreground/15 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-brand-blue" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-display text-lg font-semibold">{b.month}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {b.obsession_metric || "Sem métrica de obsessão definida"}
                    </p>
                  </div>
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
    archived: { label: "Arquivado", className: "bg-muted/60 text-muted-foreground/70 border-border" },
  };
  const v = map[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${v.className}`}>
      {v.label}
    </Badge>
  );
}
