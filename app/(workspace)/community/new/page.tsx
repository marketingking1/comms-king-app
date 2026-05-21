"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgentStream } from "@/components/agent-stream/agent-stream";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function NewCommunityReportPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [weekOf, setWeekOf] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // domingo da semana atual
    return d.toISOString().slice(0, 10);
  });
  const [rawExport, setRawExport] = useState("");
  const [output, setOutput] = useState("");
  const [saving, setSaving] = useState(false);

  const prompt = `Export bruto da comunidade (Instagram) da semana de ${weekOf}:

${rawExport || "(vazio — Daniel/editora precisa colar export)"}

Aplique a Parte 2 do agente (Inteligência de Comunidade). Gere o report semanal estruturado completo:
- Volume e sentimento agregado
- Top 5 objeções com verbatims reais
- Expressões novas / linguagem fresca
- Sinais de zeitgeist emergente (pra zeitgeist-hunter)
- UGC candidatos (pra storyteller-viral)
- Comportamento por peça (se houver dados)
- Recomendações específicas pra cada agente do squad`;

  async function save() {
    if (!output) {
      toast.error("Rode o agente primeiro");
      return;
    }
    setSaving(true);
    try {
      const sentiment = parseSentiment(output);
      const objections = parseList(output, /Top.*Objeções?[\s\S]*?\n([\s\S]*?)(?=\n##|$)/i);
      const ugc = parseList(output, /UGC[\s\S]*?\n([\s\S]*?)(?=\n##|$)/i);
      const freshLang = parseList(output, /Expressões?[\s\S]*?\n([\s\S]*?)(?=\n##|$)/i);

      const { data, error } = await supabase
        .from("community_signals")
        .insert({
          week_of: weekOf,
          sentiment_summary: sentiment,
          top_objections: objections.slice(0, 10).map((t) => ({ text: t })),
          fresh_language: freshLang.slice(0, 20),
          ugc_candidates: ugc.slice(0, 10).map((t) => ({ text: t })),
          raw_markdown: output,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Report salvo");
      router.push(`/community/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Novo report de comunidade</h1>
        <p className="text-muted-foreground mt-1">
          Cole o export semanal e rode <code className="bg-muted px-1 rounded">comms-community-manager</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrada</CardTitle>
          <CardDescription>
            Modo degradado: cole o export manual de comments+DMs da semana.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="week">Semana de (domingo)</Label>
            <Input
              id="week"
              type="date"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raw">Export bruto (comments + DMs + menções)</Label>
            <Textarea
              id="raw"
              rows={12}
              placeholder="Cole top 20-30 comments da semana, DMs relevantes, menções. Formato livre."
              value={rawExport}
              onChange={(e) => setRawExport(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <AgentStream
        agent="comms-community-manager"
        prompt={prompt}
        buttonLabel="Analisar comunidade"
        title="comms-community-manager"
        onComplete={setOutput}
      />

      {output && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar report"}
          </Button>
        </div>
      )}
    </div>
  );
}

function parseSentiment(md: string): Record<string, number> {
  const m = md.match(/(\d+)%\s*positivo[\s·\-,]+(\d+)%\s*neutro[\s·\-,]+(\d+)%\s*negativo/i);
  if (m) return { positive: Number(m[1]), neutral: Number(m[2]), negative: Number(m[3]) };
  return {};
}

function parseList(md: string, regex: RegExp): string[] {
  const match = md.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.trim().replace(/^[-*•|\d.]+\s*/, ""))
    .filter((l) => l.length > 0 && l.length < 300)
    .slice(0, 20);
}
