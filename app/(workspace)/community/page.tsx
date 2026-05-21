import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";

export default async function CommunityPage() {
  const supabase = await createSupabaseServerClient();

  const { data: signals } = await supabase
    .from("community_signals")
    .select("id, week_of, sentiment_summary, top_objections, ugc_candidates, created_at")
    .order("week_of", { ascending: false })
    .limit(20);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Comunidade</h1>
          <p className="text-muted-foreground mt-1">
            Reports semanais — comms-community-manager
          </p>
        </div>
        <Link href="/community/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Novo report
        </Link>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6 flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Modo degradado:</strong> scope <code>instagram_manage_comments</code> ainda não
            autorizado pela Meta. Comments e DMs precisam ser exportados manualmente toda sexta e
            colados no formulário em &quot;Novo report&quot;.
          </span>
        </CardContent>
      </Card>

      {!signals?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>Nenhum report ainda. Comece com o primeiro export da semana.</p>
            <Link
              href="/community/new"
              className={`${buttonVariants()} inline-flex mt-4`}
            >
              Criar primeiro report
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {signals.map((s) => {
            const ugcCount = Array.isArray(s.ugc_candidates) ? s.ugc_candidates.length : 0;
            const objCount = Array.isArray(s.top_objections) ? s.top_objections.length : 0;
            const sentiment = typeof s.sentiment_summary === "object" && s.sentiment_summary
              ? (s.sentiment_summary as { positive?: number; neutral?: number; negative?: number })
              : null;
            return (
              <Link key={s.id} href={`/community/${s.id}`}>
                <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Semana de {s.week_of ? new Date(s.week_of).toLocaleDateString("pt-BR") : "—"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground flex gap-4">
                    <span>{objCount} objeções</span>
                    <span>{ugcCount} UGCs</span>
                    {sentiment?.positive !== undefined && (
                      <span>
                        {sentiment.positive}% positivo · {sentiment.negative ?? 0}% negativo
                      </span>
                    )}
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
