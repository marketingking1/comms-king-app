import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function IdeasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: ideas } = await supabase
    .from("big_ideas")
    .select("id, title, thesis, status, brief_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Big Ideas</h1>
        <p className="text-muted-foreground mt-1">
          Teses estratégicas $1M — comms-million-strategist
        </p>
      </div>

      {!ideas?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>Nenhuma Big Idea criada ainda. Vá em <Link href="/briefs" className="text-foreground underline">Briefs</Link> e gere a partir de um brief.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {ideas.map((idea) => (
            <Link key={idea.id} href={`/ideas/${idea.id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{idea.title}</CardTitle>
                      {idea.thesis && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {idea.thesis}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        idea.status === "approved"
                          ? "default"
                          : idea.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {idea.status}
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
