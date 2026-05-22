"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, StopCircle, User } from "lucide-react";
import type { AgentName } from "@/lib/ai/providers";

export type ChatMessage = { role: "user" | "assistant"; content: string };

type Props = {
  agent: AgentName;
  /** First user message — disparado automaticamente no primeiro render quando informado. */
  initialPrompt?: string;
  /** Auto-arranca o agente assim que monta? default true se initialPrompt informado. */
  autoStart?: boolean;
  title?: string;
  /** Recebe a transcrição completa (último assistant ou tudo) sempre que termina um turno. */
  onAssistantTurn?: (latestAssistant: string, transcript: ChatMessage[]) => void;
  /** Botão extra no header (ex: "Salvar brief"). */
  rightSlot?: React.ReactNode;
  inputPlaceholder?: string;
};

export function AgentChat({
  agent,
  initialPrompt,
  autoStart = true,
  title,
  onAssistantTurn,
  rightSlot,
  inputPlaceholder = "Responda aqui... (Cmd/Ctrl+Enter pra enviar)",
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pendingAssistant, setPendingAssistant] = useState("");
  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll quando há novo conteúdo
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pendingAssistant]);

  // Boot: se tem initialPrompt e autoStart, dispara primeiro turno
  useEffect(() => {
    if (!autoStart || !initialPrompt || startedRef.current) return;
    startedRef.current = true;
    void sendTurn([{ role: "user", content: initialPrompt }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendTurn(history: ChatMessage[]) {
    setMessages(history);
    setStreaming(true);
    setPendingAssistant("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`/api/agents/${agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Erro ao rodar agente");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPendingAssistant(acc);
      }
      const streamErr = acc.match(/\[STREAM (?:ERROR|EXCEPTION)\]\s*([\s\S]+)$/);
      if (streamErr) {
        toast.error(`Provider erro: ${streamErr[1].slice(0, 200)}`);
        setMessages(history);
        setPendingAssistant("");
        return;
      }
      const finalHistory: ChatMessage[] = [
        ...history,
        { role: "assistant", content: acc },
      ];
      setMessages(finalHistory);
      setPendingAssistant("");
      onAssistantTurn?.(acc, finalHistory);
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setPendingAssistant("");
        return;
      }
      toast.error(e instanceof Error ? e.message : "Erro");
      setPendingAssistant("");
    } finally {
      setStreaming(false);
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setInput("");
    void sendTurn(next);
  }

  function handleStop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  const hasContent = messages.length > 0 || streaming || pendingAssistant;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {title || agent}
          </CardTitle>
          <div className="flex items-center gap-2">
            {streaming && (
              <Button size="sm" variant="outline" onClick={handleStop} className="cursor-pointer">
                <StopCircle className="h-4 w-4" aria-hidden="true" />
                Parar
              </Button>
            )}
            {rightSlot}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasContent && (
          <p className="text-sm text-muted-foreground">
            Aguardando primeira mensagem...
          </p>
        )}

        <div
          ref={scrollRef}
          className="space-y-4 max-h-[600px] overflow-y-auto pr-2"
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {streaming && (
            <Bubble
              role="assistant"
              content={pendingAssistant || "..."}
              streaming
            />
          )}
        </div>

        <div className="border rounded-md flex items-end gap-2 p-2 bg-card">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            rows={3}
            className="resize-none border-0 focus-visible:ring-0 shadow-none p-2"
            disabled={streaming}
            aria-label="Mensagem pro agente"
          />
          <Button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            size="icon"
            className="h-9 w-9 cursor-pointer flex-shrink-0"
            aria-label="Enviar mensagem"
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Bubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm ${
          isUser
            ? "bg-brand-blue text-white"
            : "bg-gradient-to-br from-brand-coral to-brand-coral/70 text-white"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-1.5">
          {isUser ? "Você" : "Agente"}
          {streaming && (
            <span className="ml-2 normal-case tracking-normal font-normal inline-flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-brand-coral animate-pulse" />
              digitando...
            </span>
          )}
        </p>
        <div
          className={`inline-block max-w-full text-left rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-brand-blue/8 text-foreground rounded-tr-md"
              : "bg-card border border-border/60 text-foreground/90 rounded-tl-md shadow-sm"
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans break-words">{content}</pre>
        </div>
      </div>
    </div>
  );
}
