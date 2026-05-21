"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ZeitgeistActions({
  pieceId,
  isFastTrack,
  rawMarkdown,
}: {
  pieceId: string;
  isFastTrack: boolean;
  rawMarkdown: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [running, setRunning] = useState(false);

  async function fastTrackToScript() {
    setRunning(true);
    try {
      toast.info("⚡ Fast-track: gerando roteiro direto...");
      const res = await fetch("/api/agents/comms-scriptwriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `MODE=FAST-TRACK\n\nPauta cultural com janela ≤48h:\n\n${rawMarkdown}\n\nProduza Reels publicável (15-30s) com Hero Brand SIMPLIFICADO (herói + vilão + tom) — sem arco narrativo completo. Aceita-se output mais cru em troca de timing.`,
          relatedEntityType: "zeitgeist_piece",
          relatedEntityId: pieceId,
        }),
      });
      const text = await streamText(res);

      const { data: script } = await supabase
        .from("scripts")
        .insert({
          format: "reels",
          duration_sec: 30,
          platform: "instagram",
          raw_markdown: text,
          status: "draft",
        })
        .select()
        .single();

      await supabase
        .from("zeitgeist_pieces")
        .update({ status: "in_pipeline", used_in_piece_id: script?.id })
        .eq("id", pieceId);

      toast.success("Roteiro fast-track pronto");
      if (script) router.push(`/scripts/${script.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  async function modoProfundo() {
    setRunning(true);
    try {
      toast.info("Encaminhando pra million-strategist (modo profundo)...");
      const res = await fetch("/api/agents/comms-million-strategist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Pauta cultural pra evoluir pra Big Idea:\n\n${rawMarkdown}\n\nGere 1-3 Big Ideas $1M que aproveitem essa pauta cultural como gatilho. Use Hero Brand + 5 elementos (Fissura · Dor Cultural · Vilão · Herói · Universo).`,
          relatedEntityType: "zeitgeist_piece",
          relatedEntityId: pieceId,
        }),
      });
      const text = await streamText(res);

      // Salva 1 Big Idea por extração simples
      const firstTitleMatch = text.match(/##+\s+Big Idea[^\n]*\n([^\n]+)/);
      const title = firstTitleMatch ? firstTitleMatch[1].trim().slice(0, 200) : "Big Idea de zeitgeist";

      const { data: bigIdea } = await supabase
        .from("big_ideas")
        .insert({
          title,
          raw_markdown: text,
          status: "proposed",
        })
        .select()
        .single();

      await supabase
        .from("zeitgeist_pieces")
        .update({ status: "in_pipeline" })
        .eq("id", pieceId);

      toast.success("Big Idea gerada");
      if (bigIdea) router.push(`/ideas/${bigIdea.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  async function reject() {
    const reason = prompt("Por que rejeitar? (anti-padrão, pisa em compliance, óbvio demais...)");
    if (!reason) return;
    const { error } = await supabase
      .from("zeitgeist_pieces")
      .update({ status: "rejected" })
      .eq("id", pieceId);
    if (error) toast.error(error.message);
    else {
      toast.success("Pauta rejeitada");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 flex flex-wrap gap-2">
        {isFastTrack ? (
          <Button onClick={fastTrackToScript} disabled={running}>
            <Zap className="h-4 w-4" />
            {running ? "Gerando..." : "Fast-track → Roteiro"}
          </Button>
        ) : (
          <Button onClick={modoProfundo} disabled={running}>
            <Wand2 className="h-4 w-4" />
            {running ? "Encaminhando..." : "Encaminhar pro million-strategist"}
          </Button>
        )}
        <Button variant="outline" onClick={reject} disabled={running}>
          <X className="h-4 w-4" />
          Rejeitar
        </Button>
      </CardContent>
    </Card>
  );
}

async function streamText(res: Response): Promise<string> {
  if (!res.ok) throw new Error("Agent error");
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
  }
  return acc;
}
