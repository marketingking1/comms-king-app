"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Zap, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  downstreamAgent,
  type BriefingType,
  isBriefingType,
} from "@/lib/briefs/routing";
import {
  SCRIPT_FORMAT_BY_TYPE,
  SCRIPT_PROMPT_HINTS,
} from "@/lib/briefs/kind-configs";

type Props = {
  briefId: string;
  briefMarkdown: string;
  briefingType: string | null;
};

export function GenerateDownstreamButton({
  briefId,
  briefMarkdown,
  briefingType,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const type: BriefingType = isBriefingType(briefingType)
    ? briefingType
    : "mensal";
  const action = downstreamAgent(type);

  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  async function run() {
    setRunning(true);
    setOutput("");
    try {
      if (!briefMarkdown || briefMarkdown.trim().length < 30) {
        throw new Error(
          "Brief sem conteúdo (raw_markdown vazio). Salve o brief com texto antes.",
        );
      }

      const message = buildAgentPrompt(type, briefMarkdown);

      const res = await fetch(`/api/agents/${action.agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
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
          /* texto puro */
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

      const streamErr = acc.match(/\[STREAM (?:ERROR|EXCEPTION)\]\s*([\s\S]+)$/);
      if (streamErr) {
        throw new Error(`Provider erro: ${streamErr[1].slice(0, 400)}`);
      }

      if (type === "mensal") {
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
          toast.warning(
            "Agente rodou mas não consegui parsear Big Ideas. Veja o output e salve manualmente.",
          );
        }
      } else {
        // scriptwriter: salva 1 script
        const fmt = SCRIPT_FORMAT_BY_TYPE[type];
        const caption = extractSection(acc, [
          "Caption do Post",
          "Caption",
          "Caption (Instagram)",
        ]);
        const hashtags = extractHashtags(acc);

        const { data, error } = await supabase
          .from("scripts")
          .insert({
            format: fmt?.format ?? "reels",
            duration_sec: fmt?.duration ?? null,
            platform: fmt?.platform ?? "instagram",
            raw_markdown: acc,
            caption,
            hashtags,
            status: "draft",
          })
          .select()
          .single();
        if (error) throw error;
        toast.success("Roteiro pronto");
        router.push(`/scripts/${data.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  const Icon =
    action.ctaIcon === "ideas"
      ? Lightbulb
      : action.ctaIcon === "fasttrack"
        ? Zap
        : Sparkles;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Icon className="h-4 w-4" />
        {action.label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{action.label}</DialogTitle>
            <DialogDescription>
              Roda{" "}
              <code className="bg-muted px-1 rounded">{action.agent}</code> com
              o brief atual como contexto
              {action.fastTrack ? " (modo FAST-TRACK)" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-3">
            {!output && !running && (
              <Button onClick={run} className="w-full">
                <Icon className="h-4 w-4" />
                Rodar agente agora
              </Button>
            )}
            {running && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando{type === "mensal" ? " Big Ideas" : " roteiro"} (~30-60s)...
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

function buildAgentPrompt(type: BriefingType, briefMarkdown: string): string {
  if (type === "mensal") {
    return `Brief estratégico do mês:

${briefMarkdown}

Gere 3 Big Ideas $1M aplicando a régua dos 5 elementos (Fissura Social + Dor Cultural + Vilão + Herói + Universo) + teste de magnitude. Documente também as candidatas REJEITADAS pra transparência. Use sequential thinking nas 5 etapas.`;
  }

  const hint = SCRIPT_PROMPT_HINTS[type] ?? "";
  const fastTrackLine =
    type === "trend"
      ? "MODE=FAST-TRACK · janela ≤48h · Hero Brand simplificado · pular arco completo · publicável direto."
      : `MODE=BRIEF-DRIVEN · use o mini-brief abaixo como contexto único.`;

  return `${fastTrackLine}

Mini-brief de origem:

${briefMarkdown}

INSTRUÇÕES:
- ${hint}
- Aplique Hero Brand simplificado: cliente herói · vilão = invisibilidade profissional / método tradicional / "tem que morar fora" · marca mentora.
- Hook 1.5s (use hook-selector) · slippery slide (Sugarman) · verbatim real só se encaixar.
- Compliance KoL OBRIGATÓRIO: nada de "fluência/fluente" como promessa pessoal de prazo · "+9 mil alunos" se houver prova social · prazo aceito "em até 12 meses".
- INCLUI no output: roteiro estruturado completo + caption (IG/LinkedIn) + hashtags (8-15 IG · 5-10 LinkedIn).

Entregue agora o roteiro publicável.`;
}

type ExtractedIdea = { title: string; thesis: string; raw: string };

function extractBigIdeas(md: string): ExtractedIdea[] {
  const blocks = md.split(/##+\s+Big Idea\s*#?\d/i).slice(1);
  return blocks.map((block, idx) => {
    const lines = block.trim().split("\n");
    const title =
      lines[0]?.replace(/^[—\s-]+/, "").trim() || `Big Idea ${idx + 1}`;
    const teseMatch = block.match(/##?\s*Tese\s*\n+([\s\S]*?)(?=\n##?|$)/i);
    const thesis = teseMatch ? teseMatch[1].trim() : "";
    return {
      title: title.slice(0, 200),
      thesis: thesis.slice(0, 1000),
      raw: `## Big Idea ${idx + 1}\n${block.trim()}`,
    };
  });
}

function extractSection(md: string, sectionNames: string[]): string {
  for (const name of sectionNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `##\\s+${escaped}[^\\n]*\\n([\\s\\S]+?)(?=\\n##|$)`,
      "i",
    );
    const m = md.match(re);
    if (m) {
      const body = m[1].trim();
      if (body.length > 5) return body.slice(0, 4000);
    }
  }
  return "";
}

function extractHashtags(md: string): string[] {
  const matches = md.match(/#[a-zA-Z0-9_À-ſ]+/g) || [];
  const uniq = Array.from(new Set(matches));
  return uniq.slice(0, 30);
}

// Mantém export antigo pra back-compat (caso outro arquivo importe)
export const GenerateBigIdeasButton = GenerateDownstreamButton;
