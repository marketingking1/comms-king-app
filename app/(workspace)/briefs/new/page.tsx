"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgentChat, type ChatMessage } from "@/components/agent-stream/agent-chat";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save, MessageSquare } from "lucide-react";

export default function NewBriefPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [businessAsk, setBusinessAsk] = useState("");
  const [context, setContext] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [lastAssistant, setLastAssistant] = useState("");
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [saving, setSaving] = useState(false);

  const initialPrompt = useMemo(
    () => `Briefing recebido do Daniel para o mês ${month}:

PEDIDO DE NEGÓCIO:
${businessAsk || "(não informado)"}

CONTEXTO ATUAL:
${context || "(não informado)"}

Aplique o Modo 1 — Diagnóstico Mensal. Faça as perguntas profundas dos 4 blocos (Negócio, Público, Marca, Cultura Interna). Quando eu responder, vá iterando comigo até ter clareza suficiente — só DEPOIS de fechar a investigação, entregue o Brief Estratégico canônico em markdown seguindo seu template. Pode me empurrar pra cima, contra-argumentar, voltar perguntas — quero ideação real, não relatório one-shot.`,
    [month, businessAsk, context],
  );

  async function saveBrief() {
    // Procura o brief estratégico no histórico: pega o último assistant longo com headers de markdown
    const finalDoc = pickBriefDoc(transcript) || lastAssistant;
    if (!finalDoc || finalDoc.length < 200) {
      toast.error("Continue a conversa até o agente entregar o brief estratégico final");
      return;
    }
    setSaving(true);
    try {
      const fullTranscript = transcript
        .map((m) => `## ${m.role === "user" ? "Daniel" : "comms-head"}\n\n${m.content}`)
        .join("\n\n---\n\n");

      const { data, error } = await supabase
        .from("briefs")
        .insert({
          month,
          status: "draft",
          raw_markdown: `${finalDoc}\n\n---\n\n# Histórico da ideação\n\n${fullTranscript}`,
          obsession_metric: extractField(finalDoc, "Métrica de Obsessão") ?? null,
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
          Diagnóstico Mensal — ideação iterativa com a <code className="bg-muted px-1 rounded">comms-head</code>
        </p>
      </div>

      {!chatStarted ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entrada inicial</CardTitle>
            <CardDescription>
              Comms-head é consultora dura — vai questionar premissas antes de aprovar.
              Depois que ela perguntar, você responde no chat até fechar o brief.
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
            <div className="flex justify-end">
              <Button
                onClick={() => setChatStarted(true)}
                disabled={!businessAsk.trim()}
                className="cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Iniciar ideação
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AgentChat
          agent="comms-head"
          initialPrompt={initialPrompt}
          title="comms-head — Diagnóstico iterativo"
          onAssistantTurn={(latest, full) => {
            setLastAssistant(latest);
            setTranscript(full);
          }}
          rightSlot={
            transcript.length >= 2 && (
              <Button onClick={saveBrief} disabled={saving} size="sm" className="cursor-pointer">
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? "Salvando..." : "Salvar brief"}
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

function extractField(md: string, fieldName: string): string | null {
  const regex = new RegExp(`##?\\s*${fieldName}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
  const match = md.match(regex);
  return match ? match[1].trim().slice(0, 500) : null;
}

/**
 * Pega o último assistant message que parece um doc estruturado de brief
 * (tem múltiplos headers markdown e tamanho razoável).
 */
function pickBriefDoc(transcript: ChatMessage[]): string | null {
  const assistantMsgs = transcript.filter((m) => m.role === "assistant");
  for (let i = assistantMsgs.length - 1; i >= 0; i--) {
    const c = assistantMsgs[i].content;
    const headerCount = (c.match(/^##?\s/gm) || []).length;
    if (c.length > 600 && headerCount >= 3) return c;
  }
  return null;
}
