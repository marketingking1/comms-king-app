"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgentStream } from "@/components/agent-stream/agent-stream";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function NewBriefPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [businessAsk, setBusinessAsk] = useState("");
  const [context, setContext] = useState("");
  const [agentOutput, setAgentOutput] = useState("");
  const [saving, setSaving] = useState(false);

  const prompt = `Briefing recebido do Daniel para o mês ${month}:

PEDIDO DE NEGÓCIO:
${businessAsk || "(não informado)"}

CONTEXTO ATUAL:
${context || "(não informado)"}

Aplique o Modo 1 — Diagnóstico Mensal. Faça as perguntas profundas dos 4 blocos (Negócio, Público, Marca, Cultura Interna), DEPOIS gere o Brief Estratégico canônico em markdown seguindo o template do agente. Não pule a investigação.`;

  async function saveBrief() {
    if (!agentOutput) {
      toast.error("Rode o agente primeiro pra gerar o brief");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("briefs")
        .insert({
          month,
          status: "draft",
          raw_markdown: agentOutput,
          obsession_metric: extractField(agentOutput, "Métrica de Obsessão") ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Brief salvo");
      router.push(`/briefs/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Novo Brief Estratégico</h1>
        <p className="text-muted-foreground mt-1">
          Modo Diagnóstico Mensal com o <code className="bg-muted px-1 rounded">comms-head</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrada</CardTitle>
          <CardDescription>
            Comms-head é uma consultora dura — vai questionar premissas antes de aprovar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ask">O que o time precisa esse mês?</Label>
            <Textarea
              id="ask"
              rows={3}
              placeholder="Ex: crescer share rate dos Reels via Big Idea anti-grátis"
              value={businessAsk}
              onChange={(e) => setBusinessAsk(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Contexto atual (opcional)</Label>
            <Textarea
              id="context"
              rows={4}
              placeholder="Dados de mês anterior · eventos relevantes · obsessão do growth · gaps que apareceram"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <AgentStream
        agent="comms-head"
        prompt={prompt}
        buttonLabel="Gerar diagnóstico + brief"
        title="comms-head — Diagnóstico Mensal"
        onComplete={setAgentOutput}
      />

      {agentOutput && (
        <div className="flex justify-end">
          <Button onClick={saveBrief} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar brief"}
          </Button>
        </div>
      )}
    </div>
  );
}

function extractField(md: string, fieldName: string): string | null {
  const regex = new RegExp(`##?\\s*${fieldName}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
  const match = md.match(regex);
  return match ? match[1].trim().slice(0, 500) : null;
}
