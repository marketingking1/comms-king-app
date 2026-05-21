"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles, StopCircle } from "lucide-react";
import type { AgentName } from "@/lib/ai/providers";

type Props = {
  agent: AgentName;
  prompt: string;
  buttonLabel?: string;
  title?: string;
  onComplete?: (text: string) => void;
};

export function AgentStream({ agent, prompt, buttonLabel, title, onComplete }: Props) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    setRunning(true);
    setOutput("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`/api/agents/${agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
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
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setOutput(acc);
      }
      onComplete?.(acc);
      toast.success(`${agent} concluído`);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {title || agent}
          </CardTitle>
          {running ? (
            <Button size="sm" variant="outline" onClick={stop}>
              <StopCircle className="h-4 w-4" />
              Parar
            </Button>
          ) : (
            <Button size="sm" onClick={run} disabled={!prompt}>
              {buttonLabel || "Rodar agente"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {running && !output && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </div>
        )}
        {output && (
          <pre className="text-sm whitespace-pre-wrap font-mono text-foreground/90 leading-relaxed max-h-[600px] overflow-auto p-4 bg-muted/40 rounded">
            {output}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
