import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IdeaActions } from "./actions";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: idea } = await supabase
    .from("big_ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (!idea) notFound();

  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, narrative_model, status, created_at")
    .eq("big_idea_id", id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/ideas" className="hover:underline">Big Ideas</Link> /
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{idea.title}</h1>
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

      {idea.status !== "rejected" && (
        <IdeaActions ideaId={idea.id} status={idea.status} />
      )}

      {idea.thesis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tese</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed">{idea.thesis}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Big Idea completa</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {idea.raw_markdown}
          </pre>
        </CardContent>
      </Card>

      {concepts && concepts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conceitos gerados desta Big Idea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {concepts.map((c) => (
              <Link key={c.id} href={`/concepts/${c.id}`}>
                <div className="border rounded p-3 hover:bg-accent/30 cursor-pointer flex justify-between">
                  <span>{c.narrative_model || "Conceito"}</span>
                  <Badge variant="secondary">{c.status}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
