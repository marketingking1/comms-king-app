import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ScriptsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: scripts } = await supabase
    .from("scripts")
    .select("id, format, duration_sec, platform, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Roteiros</h1>
        <p className="text-muted-foreground mt-1">Roteiros publicáveis editáveis inline</p>
      </div>
      {!scripts?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>Nenhum roteiro ainda. Aprove uma Big Idea + gere um conceito.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {scripts.map((s) => (
            <Link key={s.id} href={`/scripts/${s.id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base capitalize">
                        {s.format || "—"} · {s.duration_sec || 0}s
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {s.platform || "instagram"}
                      </p>
                    </div>
                    <Badge variant={s.status === "approved" ? "default" : "secondary"}>
                      {s.status}
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
