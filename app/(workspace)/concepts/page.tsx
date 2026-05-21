import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ConceptsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, narrative_model, hook_verbal, stepps_dominant, status, big_idea_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Conceitos narrativos</h1>
        <p className="text-muted-foreground mt-1">
          Hero Brand + 3 Regras + STEPPS — comms-storyteller-viral
        </p>
      </div>

      {!concepts?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>
              Nenhum conceito ainda. Aprove uma Big Idea em{" "}
              <Link href="/ideas" className="text-foreground underline">
                Big Ideas
              </Link>{" "}
              pra gerar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {concepts.map((c) => (
            <Link key={c.id} href={`/concepts/${c.id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {c.hook_verbal || c.narrative_model || "Conceito"}
                      </CardTitle>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {c.narrative_model && (
                          <Badge variant="outline" className="text-xs">
                            {c.narrative_model}
                          </Badge>
                        )}
                        {c.stepps_dominant && (
                          <Badge variant="outline" className="text-xs">
                            STEPPS: {c.stepps_dominant}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={c.status === "approved" ? "default" : "secondary"}>
                      {c.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
