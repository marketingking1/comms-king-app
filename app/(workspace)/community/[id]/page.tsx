import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownProse } from "@/components/markdown-prose";
import { ChevronLeft, Users, Sparkles } from "lucide-react";

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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-3">
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Comunidade
        </Link>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              Report semanal
            </p>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
              Semana de{" "}
              {signal.week_of ? new Date(signal.week_of).toLocaleDateString("pt-BR") : "—"}
            </h1>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Report completo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 lg:p-8">
          {signal.raw_markdown ? (
            <MarkdownProse markdown={signal.raw_markdown} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem conteúdo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
