import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZeitgeistActions } from "./actions";
import { Clock } from "lucide-react";

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
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/zeitgeist" className="hover:underline">Zeitgeist</Link> /
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{piece.topic}</h1>
          {piece.expires_at && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {expired ? "Janela expirou" : `Expira ${new Date(piece.expires_at).toLocaleString("pt-BR")}`}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge
            variant={
              piece.status === "used"
                ? "default"
                : piece.status === "expired" || piece.status === "rejected"
                  ? "destructive"
                  : "secondary"
            }
          >
            {piece.status}
          </Badge>
          {isFastTrack && <Badge variant="outline">⚡ Fast-track</Badge>}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ângulo King</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed">{piece.king_angle}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análise completa do hunter</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {piece.raw_markdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
