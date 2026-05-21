import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GenerateBigIdeasButton } from "./generate-button";

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: brief } = await supabase
    .from("briefs")
    .select("*")
    .eq("id", id)
    .single();

  if (!brief) notFound();

  const { data: ideas } = await supabase
    .from("big_ideas")
    .select("id, title, status, created_at")
    .eq("brief_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/briefs" className="hover:underline">Briefs</Link> /
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Brief {brief.month}</h1>
        </div>
        <Badge variant={brief.status === "approved" ? "default" : "secondary"}>
          {brief.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteúdo do brief</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {brief.raw_markdown}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Big Ideas desse brief</CardTitle>
            <GenerateBigIdeasButton briefId={brief.id} briefMarkdown={brief.raw_markdown || ""} />
          </div>
        </CardHeader>
        <CardContent>
          {!ideas?.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma Big Idea gerada ainda. Clique no botão acima pra rodar o <code className="bg-muted px-1 rounded">comms-million-strategist</code>.
            </p>
          ) : (
            <div className="space-y-2">
              {ideas.map((i) => (
                <Link key={i.id} href={`/ideas/${i.id}`}>
                  <div className="border rounded-md p-3 hover:bg-accent/30 cursor-pointer flex items-center justify-between">
                    <div>
                      <p className="font-medium">{i.title}</p>
                    </div>
                    <Badge
                      variant={
                        i.status === "approved"
                          ? "default"
                          : i.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {i.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
