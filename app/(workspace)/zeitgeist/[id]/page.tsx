import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZeitgeistActions } from "./actions";
import { MarkdownProse } from "@/components/markdown-prose";
import { ChevronLeft, Clock, Zap, Sparkles, Compass } from "lucide-react";

export default async function ZeitgeistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: piece } = await supabase
    .from("zeitgeist_pieces")
    .select("*")
    .eq("id", id)
    .single();

  if (!piece) notFound();

  const expired = piece.expires_at && new Date(piece.expires_at).getTime() < Date.now();
  const isFastTrack = piece.window_type === "le48h";

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-3">
        <Link
          href="/zeitgeist"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Zeitgeist
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="h-12 w-12 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                Pauta cultural
              </p>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight leading-tight">
                {piece.topic}
              </h1>
              {piece.expires_at && (
                <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {expired ? "Janela expirou" : `Expira ${new Date(piece.expires_at).toLocaleString("pt-BR")}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <StatusBadge status={piece.status} />
            {isFastTrack && (
              <Badge variant="outline" className="gap-1 text-[10px] bg-brand-coral/10 text-brand-coral border-brand-coral/30">
                <Zap className="h-3 w-3" aria-hidden="true" /> Fast-track
              </Badge>
            )}
          </div>
        </div>
      </div>

      {piece.status === "new" && !expired && (
        <ZeitgeistActions
          pieceId={piece.id}
          isFastTrack={isFastTrack}
          rawMarkdown={piece.raw_markdown}
        />
      )}

      {piece.king_angle && (
        <Card className="border-l-4 border-l-brand-coral">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-brand-coral" />
              Ângulo King
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-foreground/90 font-medium">{piece.king_angle}</p>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Análise completa do hunter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 lg:p-8">
          {piece.raw_markdown ? (
            <MarkdownProse markdown={piece.raw_markdown} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem análise.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    new: { label: "Nova", className: "bg-brand-blue/12 text-brand-blue border-brand-blue/30" },
    in_pipeline: { label: "No pipeline", className: "bg-brand-coral/12 text-brand-coral border-brand-coral/30" },
    used: { label: "Usada", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
    rejected: { label: "Rejeitada", className: "bg-destructive/12 text-destructive border-destructive/30" },
    expired: { label: "Expirada", className: "bg-muted/60 text-muted-foreground/70 border-border" },
  };
  const v = map[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium whitespace-nowrap ${v.className}`}>
      {v.label}
    </Badge>
  );
}
