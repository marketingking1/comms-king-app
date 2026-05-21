import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default async function BriefsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: briefs } = await supabase
    .from("briefs")
    .select("id, month, status, obsession_metric, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Briefs</h1>
          <p className="text-muted-foreground mt-1">
            Briefs estratégicos mensais — comms-head
          </p>
        </div>
        <Link href="/briefs/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Novo brief
        </Link>
      </div>

      {!briefs?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>Nenhum brief criado ainda.</p>
            <Link href="/briefs/new" className={`${buttonVariants()} mt-4 inline-flex`}>
              Criar o primeiro
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {briefs.map((b) => (
            <Link key={b.id} href={`/briefs/${b.id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{b.month}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {b.obsession_metric || "Sem métrica de obsessão definida"}
                      </p>
                    </div>
                    <Badge variant={b.status === "approved" ? "default" : "secondary"}>
                      {b.status}
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
