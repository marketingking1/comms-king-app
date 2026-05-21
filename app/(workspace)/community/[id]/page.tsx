import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: signal } = await supabase
    .from("community_signals")
    .select("*")
    .eq("id", id)
    .single();

  if (!signal) notFound();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/community" className="hover:underline">Comunidade</Link> /
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Semana de{" "}
          {signal.week_of ? new Date(signal.week_of).toLocaleDateString("pt-BR") : "—"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report completo</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {signal.raw_markdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
