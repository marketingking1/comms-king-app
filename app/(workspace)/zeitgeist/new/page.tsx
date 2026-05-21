"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentStream } from "@/components/agent-stream/agent-stream";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function NewZeitgeistPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [windowType, setWindowType] = useState<"le48h" | "1-2sem" | "2-4sem" | "30+">("1-2sem");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [saving, setSaving] = useState(false);

  const prompt = `Pauta cultural pra investigar:

TÓPICO/EVENTO: ${topic}
FONTE INICIAL: ${source || "(não informada)"}
JANELA ESTIMADA: ${windowType}

CONTEXTO ADICIONAL:
${context || "(sem contexto extra)"}

Aplique o processo de 5 etapas (Captura → Filtro King → Ângulo Contrário/Profundo → Validação Compliance/Marca → Janela Timing). Entregue ângulo King, justificativa e recomendação de execução (formato/plataforma/tom).${windowType === "le48h" ? " ⚡ JANELA FAST-TRACK: ser sucinto, pular detalhes não-essenciais." : ""}`;

  async function save() {
    if (!output || !topic) {
      toast.error("Rode o agente e preencha o tópico");
      return;
    }
    setSaving(true);
    try {
      const expiresAt = windowToExpiry(windowType);
      const kingAngle = extractField(output, "King precisa dizer") || extractField(output, "Contrário-King");
      const { data, error } = await supabase
        .from("zeitgeist_pieces")
        .insert({
          topic,
          source: source || null,
          window_type: windowType,
          expires_at: expiresAt,
          king_angle: kingAngle?.slice(0, 1000),
          raw_markdown: output,
          status: "new",
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Pauta salva");
      router.push(`/zeitgeist/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Nova pauta cultural</h1>
        <p className="text-muted-foreground mt-1">
          Caça com <code className="bg-muted px-1 rounded">comms-zeitgeist-hunter</code> — visão contrária/profunda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrada</CardTitle>
          <CardDescription>
            Sua missão: NÃO ser o 100º a postar o óbvio. King precisa de ângulo único.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Tópico ou evento</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: polêmica de demissões por IA · debate sobre MBA caro · evento corporativo X"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Fonte (link/recorte)</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Onde viu primeiro"
              />
            </div>
            <div className="space-y-2">
              <Label>Janela de timing</Label>
              <Select value={windowType} onValueChange={(v) => setWindowType(v as typeof windowType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="le48h">⚡ ≤48h (Fast-track)</SelectItem>
                  <SelectItem value="1-2sem">1-2 semanas</SelectItem>
                  <SelectItem value="2-4sem">2-4 semanas</SelectItem>
                  <SelectItem value="30+">Evergreen cultural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctx">Contexto extra (opcional)</Label>
            <Textarea
              id="ctx"
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Volume de conversa · quem tá falando · porquê isso é da King"
            />
          </div>
        </CardContent>
      </Card>

      <AgentStream
        agent="comms-zeitgeist-hunter"
        prompt={prompt}
        buttonLabel="Caçar ângulo"
        title="comms-zeitgeist-hunter"
        onComplete={setOutput}
      />

      {output && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar pauta"}
          </Button>
        </div>
      )}
    </div>
  );
}

function windowToExpiry(w: "le48h" | "1-2sem" | "2-4sem" | "30+"): string {
  const now = Date.now();
  const hours = w === "le48h" ? 48 : w === "1-2sem" ? 24 * 10 : w === "2-4sem" ? 24 * 21 : 24 * 45;
  return new Date(now + hours * 3600 * 1000).toISOString();
}

function extractField(md: string, fieldName: string): string | null {
  const regex = new RegExp(`${fieldName}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|\\n\\*\\*|$)`, "i");
  const m = md.match(regex);
  return m ? m[1].trim() : null;
}
