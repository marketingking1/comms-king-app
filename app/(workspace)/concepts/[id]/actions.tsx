"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ConceptActions({
  conceptId,
  bigIdeaId,
}: {
  conceptId: string;
  bigIdeaId: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [running, setRunning] = useState(false);

  async function pipelineToScript() {
    setRunning(true);
    try {
      // 1. Carrega o conceito
      const { data: concept } = await supabase
        .from("concepts")
        .select("raw_markdown")
        .eq("id", conceptId)
        .single();

      // 2. funnel-curator decide formato/plataforma
      toast.info("Rodando comms-funnel-curator...");
      const funnelRes = await fetch("/api/agents/comms-funnel-curator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Conceito narrativo aprovado:\n\n${concept?.raw_markdown}\n\nDecida etapa do funil, formato, duração, plataforma. Aplique a matriz e justifique cada decisão.`,
          relatedEntityType: "concept",
          relatedEntityId: conceptId,
        }),
      });
      const funnelText = await streamText(funnelRes);

      await supabase.from("funnel_decisions").upsert({
        concept_id: conceptId,
        format: extractField(funnelText, "Formato") || "reels",
        funnel_stage: extractField(funnelText, "Etapa de funil")?.toLowerCase().includes("topo") ? "topo"
          : extractField(funnelText, "Etapa de funil")?.toLowerCase().includes("meio") ? "meio" : "fundo",
        platform_primary: "instagram",
      });

      // 3. scriptwriter gera roteiro
      toast.info("Rodando comms-scriptwriter...");
      const scriptRes = await fetch("/api/agents/comms-scriptwriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Pacote consolidado pra roteiro:\n\nCONCEITO NARRATIVO:\n${concept?.raw_markdown}\n\nDECISÕES DE FUNIL:\n${funnelText}\n\nProduza o roteiro publicável final usando o template apropriado (Reels/Carrossel/Stories/Post/YT). Tabela tempo/áudio/visual/texto completa + caption + hashtags.`,
          relatedEntityType: "concept",
          relatedEntityId: conceptId,
        }),
      });
      const scriptText = await streamText(scriptRes);

      const { data: script } = await supabase
        .from("scripts")
        .insert({
          concept_id: conceptId,
          format: extractField(funnelText, "Formato") || "reels",
          duration_sec: parseInt(extractField(funnelText, "Duração") || "30") || 30,
          platform: "instagram",
          raw_markdown: scriptText,
          status: "draft",
        })
        .select()
        .single();

      toast.success("Roteiro gerado");
      if (script) router.push(`/scripts/${script.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Button onClick={pipelineToScript} disabled={running}>
          <Wand2 className="h-4 w-4" />
          {running ? "Rodando pipeline..." : "Gerar roteiro (funnel-curator → scriptwriter)"}
        </Button>
      </CardContent>
    </Card>
  );
}

async function streamText(res: Response): Promise<string> {
  if (!res.ok) {
    const body = await res.text();
    let detail = body;
    try {
      const json = JSON.parse(body);
      detail = json.error || json.message || body;
    } catch {
      // body é texto puro
    }
    throw new Error(`HTTP ${res.status}: ${detail.slice(0, 400)}`);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
  }
  if (!acc.trim()) throw new Error("Agente respondeu vazio (erro mid-stream provável)");
  const m = acc.match(/\[STREAM (?:ERROR|EXCEPTION)\]\s*([\s\S]+)$/);
  if (m) throw new Error(`Provider erro: ${m[1].slice(0, 400)}`);
  return acc;
}

function extractField(md: string, field: string): string | null {
  const regex = new RegExp(`${field}\\s*[:|]\\s*\\**?\\s*([^\\n*|]+)`, "i");
  const m = md.match(regex);
  return m ? m[1].trim() : null;
}
