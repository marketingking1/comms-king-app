import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Clock, AlertTriangle } from "lucide-react";

export default async function ZeitgeistPage() {
  const supabase = await createSupabaseServerClient();
  const { data: pieces } = await supabase
    .from("zeitgeist_pieces")
    .select("id, topic, source, window_type, status, expires_at, king_angle, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const now = Date.now();
  const expiringSoon = pieces?.filter(
    (p) => p.expires_at && new Date(p.expires_at).getTime() - now < 24 * 3600 * 1000 && p.status === "new",
  ).length || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Zeitgeist</h1>
          <p className="text-muted-foreground mt-1">
            Pautas culturais quentes — comms-zeitgeist-hunter
          </p>
        </div>
        <Link href="/zeitgeist/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Caçar pauta
        </Link>
      </div>

      {expiringSoon > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>
              <strong>{expiringSoon}</strong> pauta(s) com janela vencendo em &lt; 24h. Acelere ou perde.
            </span>
          </CardContent>
        </Card>
      )}

      {!pieces?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>Nenhuma pauta caçada ainda. Rode o caçador na próxima onda cultural.</p>
            <Link href="/zeitgeist/new" className={`${buttonVariants()} inline-flex mt-4`}>
              Iniciar caça
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pieces.map((p) => {
            const expired = p.expires_at && new Date(p.expires_at).getTime() < now;
            return (
              <Link key={p.id} href={`/zeitgeist/${p.id}`}>
                <Card
                  className={`hover:bg-accent/30 transition-colors cursor-pointer ${expired ? "opacity-60" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base">{p.topic}</CardTitle>
                        {p.king_angle && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {p.king_angle}
                          </p>
                        )}
                        {p.expires_at && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {expired
                              ? "Janela expirou"
                              : `Janela: ${relativeTime(p.expires_at)}`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge
                          variant={
                            p.status === "used"
                              ? "default"
                              : p.status === "expired" || p.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {p.status}
                        </Badge>
                        {p.window_type && (
                          <Badge variant="outline" className="text-xs">
                            {p.window_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function relativeTime(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "expirou";
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h restantes`;
  const d = Math.floor(h / 24);
  return `${d}d restantes`;
}
