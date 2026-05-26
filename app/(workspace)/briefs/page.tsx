import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  BRIEFING_TYPE_LABELS,
  isBriefingType,
  type BriefingType,
} from "@/lib/briefs/routing";

export default async function BriefsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: briefs } = await supabase
    .from("briefs")
    .select("id, month, status, obsession_metric, briefing_type, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Estratégia"
        title="Briefs"
        description="Brief mensal estratégico · ou mini-briefs tipados (isolado · carrossel · post · trend)"
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
                Na próxima tela você escolhe o tipo: <strong className="text-foreground">mensal</strong> (estratégico, com <code className="bg-muted px-1 py-0.5 rounded text-[10px]">comms-head</code>) · isolado · carrossel · post · trend.
              </p>
            </div>
            <Link href="/briefs/new" className={`${buttonVariants({ className: "rounded-full cursor-pointer" })} mt-2`}>
              <Plus className="h-4 w-4" />
              Criar o primeiro
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 stagger">
          {briefs.map((b) => {
            const type: BriefingType = isBriefingType(b.briefing_type)
              ? b.briefing_type
              : "mensal";
            const title =
              type === "mensal" && b.month
                ? b.month
                : BRIEFING_TYPE_LABELS[type];
            const subtitle =
              type === "mensal"
                ? cleanText(b.obsession_metric) || "Sem métrica de obsessão definida"
                : formatRelativeDate(b.created_at);
            return (
              <Link key={b.id} href={`/briefs/${b.id}`} className="group block">
                <Card className="hover:shadow-md hover:border-foreground/15 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4.5 w-4.5 text-brand-blue" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-display text-base font-semibold tabular-nums">{title}</p>
                        <TypeBadge type={type} />
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {subtitle}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" aria-hidden="true" />
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

/** Remove markers de markdown pra preview compacto. */
function cleanText(s: string | null): string | null {
  if (!s) return null;
  return s.replace(/[*_`#>]+/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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
    <Badge variant="outline" className={`text-[10px] font-medium ${map[type]}`}>
      {BRIEFING_TYPE_LABELS[type]}
    </Badge>
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
