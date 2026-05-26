"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentChat, type ChatMessage } from "@/components/agent-stream/agent-chat";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save, MessageSquare, Loader2 } from "lucide-react";
import {
  BRIEFING_TYPES,
  BRIEFING_TYPE_LABELS,
  BRIEFING_TYPE_DESCRIPTIONS,
  isBriefingType,
  type BriefingType,
} from "@/lib/briefs/routing";
import {
  TOM_OPTIONS,
  PERSONA_OPTIONS,
  COMPORTAMENTO_OPTIONS,
} from "@/lib/briefs/kind-configs";

type TrendPreload = {
  id: string;
  topic: string;
  king_angle: string | null;
  description: string | null;
  source: string | null;
};

type FormState = {
  // mensal
  month: string;
  businessAsk: string;
  context: string;
  // isolado
  isoladoTema: string;
  isoladoObjetivo: string;
  // carrossel
  carrosselTema: string;
  carrosselComportamento: string;
  // post
  postGancho: string;
  postVilao: string;
  // trend
  trendTopic: string;
  trendKingAngle: string;
  trendJanela: string;
  // shared
  tom: string;
  persona: string;
};

const INITIAL_STATE: FormState = {
  month: new Date().toISOString().slice(0, 7),
  businessAsk: "",
  context: "",
  isoladoTema: "",
  isoladoObjetivo: "save",
  carrosselTema: "",
  carrosselComportamento: "save",
  postGancho: "",
  postVilao: "",
  trendTopic: "",
  trendKingAngle: "",
  trendJanela: "",
  tom: "auto",
  persona: "auto",
};

export default function NewBriefPage() {
  return (
    <Suspense fallback={null}>
      <NewBriefInner />
    </Suspense>
  );
}

function NewBriefInner() {
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");
  const fromTrendId = searchParams.get("fromTrend");

  const initialType: BriefingType = fromTrendId
    ? "trend"
    : isBriefingType(queryType)
      ? queryType
      : "mensal";

  const [type, setType] = useState<BriefingType>(initialType);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [trendData, setTrendData] = useState<TrendPreload | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    if (!fromTrendId) return;
    setTrendLoading(true);
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("trends")
      .select("id, topic, king_angle, description, source")
      .eq("id", fromTrendId)
      .single()
      .then(({ data }) => {
        if (data) {
          setTrendData(data as TrendPreload);
          setForm((prev) => ({
            ...prev,
            trendTopic: data.topic ?? "",
            trendKingAngle: data.king_angle ?? "",
          }));
        }
        setTrendLoading(false);
      });
  }, [fromTrendId]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Novo briefing</h1>
        <p className="text-muted-foreground mt-1">
          Escolha o tipo · o agente faz só as perguntas essenciais · entrega tipada
          pros agentes a jusante.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de briefing</CardTitle>
          <CardDescription>{BRIEFING_TYPE_DESCRIPTIONS[type]}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={type}
            onValueChange={(v) => setType((v as BriefingType) ?? "mensal")}
          >
            <SelectTrigger className="w-full md:w-96">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRIEFING_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {BRIEFING_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <BriefingFlow
        type={type}
        form={form}
        setForm={setForm}
        trendData={trendData}
        trendLoading={trendLoading}
      />
    </div>
  );
}

function BriefingFlow({
  type,
  form,
  setForm,
  trendData,
  trendLoading,
}: {
  type: BriefingType;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  trendData: TrendPreload | null;
  trendLoading: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [chatStarted, setChatStarted] = useState(false);
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [lastAssistant, setLastAssistant] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset chat quando o tipo muda
  useEffect(() => {
    setChatStarted(false);
    setTranscript([]);
    setLastAssistant("");
  }, [type]);

  const initialPrompt = useMemo(
    () => buildInitialPrompt(type, form, trendData),
    [type, form, trendData],
  );

  const canStart = useMemo(() => isFormReady(type, form), [type, form]);

  async function saveBrief() {
    const minLen = type === "mensal" ? 200 : 80;
    const finalDoc = pickBriefDoc(transcript, type) || lastAssistant;
    if (!finalDoc || finalDoc.length < minLen) {
      toast.error(
        type === "mensal"
          ? "Continue a conversa até o agente entregar o brief estratégico final"
          : "Continue até o agente entregar o mini-brief estruturado",
      );
      return;
    }
    setSaving(true);
    try {
      const fullTranscript = transcript
        .map(
          (m) =>
            `## ${m.role === "user" ? "Daniel" : "comms-head"}\n\n${m.content}`,
        )
        .join("\n\n---\n\n");

      const payload: Record<string, unknown> = {
        briefing_type: type,
        status: "draft",
        raw_markdown: `${finalDoc}\n\n---\n\n# Histórico da ideação\n\n${fullTranscript}`,
      };

      if (type === "mensal") {
        payload.month = form.month;
        payload.obsession_metric =
          extractField(finalDoc, "Métrica de Obsessão") ?? null;
      }
      if (type === "trend" && trendData?.id) {
        payload.source_trend_id = trendData.id;
      }

      const { data, error } = await supabase
        .from("briefs")
        .insert(payload)
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

  if (chatStarted) {
    return (
      <AgentChat
        agent="comms-head"
        initialPrompt={initialPrompt}
        title={`comms-head — ${BRIEFING_TYPE_LABELS[type]}`}
        onAssistantTurn={(latest, full) => {
          setLastAssistant(latest);
          setTranscript(full);
        }}
        rightSlot={
          transcript.length >= 2 && (
            <Button
              onClick={saveBrief}
              disabled={saving}
              size="sm"
              className="cursor-pointer"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? "Salvando..." : "Salvar brief"}
            </Button>
          )
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {entryTitle(type)}
        </CardTitle>
        <CardDescription>{entryHint(type)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TypeForm
          type={type}
          form={form}
          setForm={setForm}
          trendData={trendData}
          trendLoading={trendLoading}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => setChatStarted(true)}
            disabled={!canStart}
            className="cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Iniciar ideação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TypeForm({
  type,
  form,
  setForm,
  trendData,
  trendLoading,
}: {
  type: BriefingType;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  trendData: TrendPreload | null;
  trendLoading: boolean;
}) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (type === "mensal") {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">Mês</Label>
            <Input
              id="month"
              type="month"
              value={form.month}
              onChange={(e) => set("month", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ask">O que o time precisa esse mês?</Label>
          <Textarea
            id="ask"
            rows={3}
            placeholder="Ex: crescer share rate dos Reels via Big Idea anti-grátis"
            value={form.businessAsk}
            onChange={(e) => set("businessAsk", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="context">Contexto atual (opcional)</Label>
          <Textarea
            id="context"
            rows={3}
            placeholder="Dados de mês anterior · eventos relevantes · obsessão do growth · gaps"
            value={form.context}
            onChange={(e) => set("context", e.target.value)}
          />
        </div>
      </>
    );
  }

  if (type === "isolado") {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="isoladoTema">Tema / ideia central</Label>
          <Textarea
            id="isoladoTema"
            rows={3}
            placeholder="Ex: bastidor da gravação · enquete sobre erro comum em call · jornada de aluna"
            value={form.isoladoTema}
            onChange={(e) => set("isoladoTema", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Comportamento-objetivo</Label>
            <Select
              value={form.isoladoObjetivo}
              onValueChange={(v) => set("isoladoObjetivo", v ?? "save")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPORTAMENTO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tom</Label>
            <TomSelect value={form.tom} onChange={(v) => set("tom", v)} />
          </div>
        </div>
      </>
    );
  }

  if (type === "carrossel") {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="carrosselTema">Tema / tese central do carrossel</Label>
          <Textarea
            id="carrosselTema"
            rows={3}
            placeholder="Ex: 5 erros que profissional brasileiro comete em call internacional · cada slide um erro + correção"
            value={form.carrosselTema}
            onChange={(e) => set("carrosselTema", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Persona-alvo</Label>
            <PersonaSelect
              value={form.persona}
              onChange={(v) => set("persona", v)}
            />
          </div>
          <div className="space-y-2">
            <Label>Comportamento-objetivo</Label>
            <Select
              value={form.carrosselComportamento}
              onValueChange={(v) => set("carrosselComportamento", v ?? "save")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPORTAMENTO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </>
    );
  }

  if (type === "post") {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="postGancho">Gancho / ângulo do Reel</Label>
          <Textarea
            id="postGancho"
            rows={3}
            placeholder="Ex: 'Você não fala inglês porque a escola te ensinou errado' · gancho 1.5s + reveal"
            value={form.postGancho}
            onChange={(e) => set("postGancho", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postVilao">Vilão (opcional)</Label>
            <Input
              id="postVilao"
              placeholder="Ex: gramática decorada · método tradicional · 'tem que morar fora'"
              value={form.postVilao}
              onChange={(e) => set("postVilao", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tom</Label>
            <TomSelect value={form.tom} onChange={(v) => set("tom", v)} />
          </div>
        </div>
      </>
    );
  }

  // trend
  return (
    <>
      {trendData && (
        <div className="rounded-lg border-l-4 border-l-primary/60 bg-primary/5 p-3 text-xs space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">
            Trend selecionada · fonte: {trendData.source ?? "?"}
          </p>
          <p className="font-medium text-sm">{trendData.topic}</p>
          {trendData.description && (
            <p className="text-muted-foreground line-clamp-2">
              {trendData.description}
            </p>
          )}
        </div>
      )}
      {trendLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Carregando trend...
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="trendTopic">Topic da trend</Label>
        <Input
          id="trendTopic"
          placeholder="Tópico cultural quente · ex: 'IA roubando empregos de tradutor'"
          value={form.trendTopic}
          onChange={(e) => set("trendTopic", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trendKingAngle">Ângulo King (pré-preenchido se vier de /trends)</Label>
        <Textarea
          id="trendKingAngle"
          rows={2}
          placeholder="Ângulo contrário/profundo · como a King se posiciona nessa trend"
          value={form.trendKingAngle}
          onChange={(e) => set("trendKingAngle", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trendJanela">Janela cultural (por quê agora — ≤48h)</Label>
        <Textarea
          id="trendJanela"
          rows={2}
          placeholder="Ex: ABM trending hoje após declaração da Maíra Cardi · pico de busca · janela 24h"
          value={form.trendJanela}
          onChange={(e) => set("trendJanela", e.target.value)}
        />
      </div>
    </>
  );
}

function TomSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "auto")}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TOM_OPTIONS.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PersonaSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "auto")}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERSONA_OPTIONS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function entryTitle(type: BriefingType): string {
  switch (type) {
    case "mensal":
      return "Entrada · diagnóstico mensal";
    case "isolado":
      return "Entrada · conteúdo isolado";
    case "carrossel":
      return "Entrada · carrossel";
    case "post":
      return "Entrada · Reel 15-30s";
    case "trend":
      return "Entrada · trend fast-track";
  }
}

function entryHint(type: BriefingType): string {
  if (type === "mensal") {
    return "Comms-head faz 3-4 perguntas essenciais. Depois entrega o Brief Estratégico canônico.";
  }
  return "Comms-head faz no máximo 1-2 perguntas. Depois entrega o mini-brief tipado pro scriptwriter.";
}

function isFormReady(type: BriefingType, form: FormState): boolean {
  switch (type) {
    case "mensal":
      return form.businessAsk.trim().length >= 8 && form.month.length >= 6;
    case "isolado":
      return form.isoladoTema.trim().length >= 8;
    case "carrossel":
      return form.carrosselTema.trim().length >= 8;
    case "post":
      return form.postGancho.trim().length >= 8;
    case "trend":
      return (
        form.trendTopic.trim().length >= 4 &&
        form.trendJanela.trim().length >= 4
      );
  }
}

function buildInitialPrompt(
  type: BriefingType,
  form: FormState,
  trendData: TrendPreload | null,
): string {
  if (type === "mensal") {
    return `BRIEFING_TYPE: mensal
MONTH: ${form.month}

PEDIDO DE NEGÓCIO:
${form.businessAsk || "(não informado)"}

CONTEXTO ATUAL:
${form.context || "(não informado)"}

Aplique o Dispatcher por Tipo — modo \`mensal\`. Faça NO MÁXIMO 4 perguntas (cap),
seguindo o playbook do tipo mensal no seu agent spec. Se o pedido inicial já cobriu
alguma das 4, pula. Quando terminar, entregue o **Brief Estratégico canônico**
(template mensal) em markdown. Provocação dentro do cap é OK; perguntas além do cap
não são.`;
  }

  if (type === "isolado") {
    return `BRIEFING_TYPE: isolado

TEMA / IDEIA:
${form.isoladoTema}

COMPORTAMENTO-OBJETIVO: ${form.isoladoObjetivo}
TOM: ${form.tom}

Aplique o Dispatcher por Tipo — modo \`isolado\`. Cap 2 perguntas (skip se o input já
cobriu). Entregue o **Mini-brief tipado** (template \`isolado\` do seu spec). Direto
publicável pro scriptwriter.`;
  }

  if (type === "carrossel") {
    return `BRIEFING_TYPE: carrossel

TEMA / TESE CENTRAL:
${form.carrosselTema}

PERSONA-ALVO: ${form.persona}
COMPORTAMENTO-OBJETIVO: ${form.carrosselComportamento}

Aplique o Dispatcher por Tipo — modo \`carrossel\`. Cap 2 perguntas. Entregue o
**Mini-brief tipado** (template \`carrossel\` do seu spec) com 3-5 beats sugeridos.`;
  }

  if (type === "post") {
    return `BRIEFING_TYPE: post

GANCHO / ÂNGULO:
${form.postGancho}

VILÃO (do input): ${form.postVilao || "(não informado — confirme/sugira)"}
TOM: ${form.tom}

Aplique o Dispatcher por Tipo — modo \`post\`. Cap 2 perguntas. Entregue o
**Mini-brief tipado** (template \`post\` do seu spec).`;
  }

  // trend
  const topicLine = form.trendTopic || trendData?.topic || "(não informado)";
  const angleLine =
    form.trendKingAngle ||
    trendData?.king_angle ||
    "(não informado — proponha)";
  return `BRIEFING_TYPE: trend
FAST_TRACK: true

TREND_TOPIC: ${topicLine}
KING_ANGLE: ${angleLine}
JANELA CULTURAL (por quê agora):
${form.trendJanela || "(não informado)"}

${trendData ? `(Trend originária registrada · source: ${trendData.source ?? "?"} · id: ${trendData.id})` : "(Input manual — sem trend originária)"}

Aplique o Dispatcher por Tipo — modo \`trend\`. Cap 2 perguntas. Entregue o
**Mini-brief tipado** (template \`trend\` do seu spec) com flag FAST_TRACK.
Próximo agente: \`comms-zeitgeist-hunter\` (registro) + \`comms-scriptwriter\` modo fast-track.`;
}

function extractField(md: string, fieldName: string): string | null {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `##?\\s*${escaped}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`,
    "i",
  );
  const match = md.match(regex);
  return match ? match[1].trim().slice(0, 500) : null;
}

/**
 * Pega o último assistant message que parece um doc estruturado de brief.
 * Critério varia por tipo: mensal exige ≥3 headers + 600 chars; tipos curtos
 * aceitam ≥2 headers + 200 chars (cabem em 1 turno).
 */
function pickBriefDoc(
  transcript: ChatMessage[],
  type: BriefingType,
): string | null {
  const minHeaders = type === "mensal" ? 3 : 2;
  const minChars = type === "mensal" ? 600 : 200;
  const assistantMsgs = transcript.filter((m) => m.role === "assistant");
  for (let i = assistantMsgs.length - 1; i >= 0; i--) {
    const c = assistantMsgs[i].content;
    const headerCount = (c.match(/^##?\s/gm) || []).length;
    if (c.length > minChars && headerCount >= minHeaders) return c;
  }
  return null;
}
