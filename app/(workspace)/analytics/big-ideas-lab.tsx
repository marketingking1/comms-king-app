"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Props = {
  context: {
    score: number;
    delta: number;
    topHooks: string;
    topClusters: string;
    saturatedClusters: string;
    goldmine: string;
    brandSearchLift: string;
    anomalies: string;
  };
};

export function BigIdeasLab({ context }: Props) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  async function generate() {
    setRunning(true);
    setOutput("");
    try {
      const res = await fetch("/api/analytics/big-ideas-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });
      if (!res.ok) throw new Error("Erro");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }
      toast.success("3 Big Ideas geradas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  async function saveAsBigIdea(title: string, content: string) {
    try {
      const res = await fetch("/api/analytics/save-big-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.id) {
        setSavedIds((ids) => [...ids, data.id]);
        toast.success("Big Idea salva — abrindo...");
        window.open(`/ideas/${data.id}`, "_blank");
      } else throw new Error(data.error || "Erro");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  // Extrair 3 Big Ideas do output
  const bigIdeas = parseBigIdeas(output);

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/[0.02] to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Big Ideas Lab — million-strategist
            </CardTitle>
            <CardDescription>
              Cruza todos os dados acima e gera 3 Big Ideas $1M com evidências
            </CardDescription>
          </div>
          <Button onClick={generate} disabled={running}>
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {output ? "Re-gerar 3 Big Ideas" : "Gerar 3 Big Ideas"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!output && !running && (
          <p className="text-sm text-muted-foreground">
            Clique acima — Claude Opus 4.7 vai analisar tudo (score, hooks, clusters, goldmine, brand search) e propor 3 Big Ideas com vilão, fissura social, formato sugerido e hook proposto.
          </p>
        )}

        {running && !output && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opus pensando... pode levar 30-90s (sequential thinking ativo)
          </div>
        )}

        {output && (
          <div className="space-y-4">
            {bigIdeas.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {bigIdeas.map((idea, i) => (
                  <div key={i} className="border rounded-md p-4 bg-card space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-tight">{idea.title}</h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0">#{i + 1}</span>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-auto opacity-90">
                      {idea.body}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => saveAsBigIdea(idea.title, idea.body)}
                    >
                      Salvar como Big Idea <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-auto p-3 bg-muted/40 rounded">
                {output}
              </pre>
            )}

            {savedIds.length > 0 && (
              <div className="text-xs text-muted-foreground">
                ✓ {savedIds.length} Big Idea(s) salva(s). Veja em{" "}
                <Link href="/ideas" className="underline">/ideas</Link>.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function parseBigIdeas(md: string): Array<{ title: string; body: string }> {
  const matches = md.split(/##\s+Big Idea\s*\d*\s*[—-]\s*/i).slice(1);
  return matches.map((m) => {
    const lines = m.trim().split("\n");
    return {
      title: lines[0]?.trim().slice(0, 120) || "Big Idea",
      body: lines.slice(1).join("\n").trim(),
    };
  });
}
