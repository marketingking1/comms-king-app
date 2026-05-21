"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function HypothesisPanel({ analyticsContext }: { analyticsContext: string }) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  async function run() {
    setRunning(true);
    setOutput("");
    try {
      const res = await fetch("/api/analytics/hypotheses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyticsContext }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error || "Erro");
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
      toast.success("Hipóteses geradas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Diagnóstico & Hipóteses (analyst-io)
            </CardTitle>
            <CardDescription>
              Agente lê tudo acima e gera 5-10 hipóteses acionáveis com plano de validação
            </CardDescription>
          </div>
          {running ? (
            <Button size="sm" variant="outline" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando...
            </Button>
          ) : (
            <Button size="sm" onClick={run}>
              <Sparkles className="h-4 w-4" />
              {output ? "Re-rodar análise" : "Gerar hipóteses"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!output && !running && (
          <p className="text-sm text-muted-foreground">
            Clique &quot;Gerar hipóteses&quot; — agente vai analisar todos os números acima e propor 5-10 teses
            específicas pra rodar no próximo sprint.
          </p>
        )}
        {output && (
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-auto p-4 bg-muted/40 rounded">
            {output}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
