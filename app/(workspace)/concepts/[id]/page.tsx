import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConceptActions } from "./actions";

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: concept } = await supabase
    .from("concepts")
    .select("*")
    .eq("id", id)
    .single();

  if (!concept) notFound();

  const { data: scripts } = await supabase
    .from("scripts")
    .select("id, format, status, created_at")
    .eq("concept_id", id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/ideas" className="hover:underline">Big Ideas</Link> /
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Conceito narrativo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {concept.narrative_model}
          </p>
        </div>
        <Badge variant={concept.status === "approved" ? "default" : "secondary"}>
          {concept.status}
        </Badge>
      </div>

      <ConceptActions conceptId={concept.id} bigIdeaId={concept.big_idea_id} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conceito completo</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {concept.raw_markdown}
          </pre>
        </CardContent>
      </Card>

      {scripts && scripts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roteiros derivados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scripts.map((s) => (
              <Link key={s.id} href={`/scripts/${s.id}`}>
                <div className="border rounded p-3 hover:bg-accent/30 cursor-pointer flex justify-between">
                  <span>{s.format || "Roteiro"}</span>
                  <Badge variant="secondary">{s.status}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
