"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GenerateBigIdeasButton({
  briefId,
  briefMarkdown,
}: {
  briefId: string;
  briefMarkdown: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  async function run() {
    setRunning(true);
    setOutput("");
    try {
      if (!briefMarkdown || briefMarkdown.trim().length < 50) {
        throw new Error("Brief sem conteúdo (raw_markdown vazio). Salve o brief com texto antes.");
      }

      const res = await fetch("/api/agents/comms-million-strategist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Brief estratégico do mês:\n\n${briefMarkdown}\n\nGere 3 Big Ideas $1M aplicando a régua dos 5 elementos (Fissura Social + Dor Cultural + Vilão + Herói + Universo) + teste de magnitude. Documente também as candidatas REJEITADAS pra transparência. Use sequential thinking nas 5 etapas.`,
          relatedEntityType: "brief",
          relatedEntityId: briefId,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        let detail = body;
        try {
          const json = JSON.parse(body);
          detail = json.error || json.message || body;
        } catch {
          // body is plain text, use as-is
        }
        throw new Error(`HTTP ${res.status}: ${detail.slice(0, 300)}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }

      // Parse: tentar extrair Big Ideas individuais e persistir
      const ideas = extractBigIdeas(acc);
      if (ideas.length > 0) {
        for (const idea of ideas) {
          await supabase.from("big_ideas").insert({
            brief_id: briefId,
            title: idea.title,
            thesis: idea.thesis,
            raw_markdown: idea.raw,
          });
        }
        toast.success(`${ideas.length} Big Ideas salvas`);
        router.refresh();
        setOpen(false);
      } else {
        toast.warning("Agente rodou mas não consegui parsear Big Ideas. Veja o output e salve manualmente.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" />
        Gerar Big Ideas
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerar 3 Big Ideas $1M</DialogTitle>
            <DialogDescription>
              Roda <code className="bg-muted px-1 rounded">comms-million-strategist</code> com o brief atual como contexto.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-3">
            {!output && !running && (
              <Button onClick={run} className="w-full">
                <Sparkles className="h-4 w-4" />
                Rodar agente agora
              </Button>
            )}
            {running && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando Big Ideas (~30-60s)...
              </div>
            )}
            {output && (
              <pre className="text-xs whitespace-pre-wrap font-mono p-4 bg-muted/40 rounded leading-relaxed">
                {output}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ExtractedIdea = { title: string; thesis: string; raw: string };

function extractBigIdeas(md: string): ExtractedIdea[] {
  const blocks = md.split(/##+\s+Big Idea\s*#?\d/i).slice(1);
  return blocks.map((block, idx) => {
    const lines = block.trim().split("\n");
    const title = lines[0]?.replace(/^[—\s-]+/, "").trim() || `Big Idea ${idx + 1}`;
    const teseMatch = block.match(/##?\s*Tese\s*\n+([\s\S]*?)(?=\n##?|$)/i);
    const thesis = teseMatch ? teseMatch[1].trim() : "";
    return { title: title.slice(0, 200), thesis: thesis.slice(0, 1000), raw: `## Big Idea ${idx + 1}\n${block.trim()}` };
  });
}
