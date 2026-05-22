"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function IdeaActions({
  ideaId,
  status,
}: {
  ideaId: string;
  status: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [generating, setGenerating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const isApproved = status === "approved";

  async function approve() {
    const { error } = await supabase
      .from("big_ideas")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", ideaId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Big Idea aprovada");
      router.refresh();
    }
  }

  async function reject() {
    const { error } = await supabase
      .from("big_ideas")
      .update({ status: "rejected", rejection_reason: rejectReason })
      .eq("id", ideaId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Big Idea rejeitada");
      setShowReject(false);
      router.refresh();
    }
  }

  async function generateConcept() {
    setGenerating(true);
    try {
      // Primeiro aprova se ainda não aprovou
      await supabase
        .from("big_ideas")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", ideaId);

      // Pega o markdown da Big Idea
      const { data: idea } = await supabase
        .from("big_ideas")
        .select("raw_markdown, title")
        .eq("id", ideaId)
        .single();

      if (!idea?.raw_markdown || idea.raw_markdown.trim().length < 50) {
        throw new Error("Big Idea sem raw_markdown (corpo vazio). Reabra a idea e veja se o conteúdo foi salvo.");
      }

      const res = await fetch("/api/agents/comms-storyteller-viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Big Idea aprovada pra gerar conceito narrativo:\n\n${idea.raw_markdown}\n\nAplique o processo de 6 etapas e gere o conceito narrativo completo em markdown. Use Hero Brand + 3 Regras + STEPPS.`,
          relatedEntityType: "big_idea",
          relatedEntityId: ideaId,
        }),
      });

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

      if (!acc.trim()) {
        throw new Error("Agente respondeu vazio (provavelmente erro mid-stream do provider). Veja os logs da Vercel.");
      }
      const streamErrMatch = acc.match(/\[STREAM (?:ERROR|EXCEPTION)\]\s*(.+)$/s);
      if (streamErrMatch) {
        throw new Error(`Provider erro: ${streamErrMatch[1].slice(0, 400)}`);
      }

      // Salva concept
      const modelMatch = acc.match(/Framework:\s*\*?\*?\s*([A-Za-z\-\s]+)/);
      const { data: concept, error: insertErr } = await supabase
        .from("concepts")
        .insert({
          big_idea_id: ideaId,
          narrative_model: modelMatch ? modelMatch[1].trim().slice(0, 100) : "auto",
          status: "draft",
          raw_markdown: acc,
        })
        .select()
        .single();

      if (insertErr) throw new Error(`Insert concept falhou: ${insertErr.message}`);

      toast.success("Conceito gerado");
      if (concept) {
        router.push(`/concepts/${concept.id}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 flex flex-wrap gap-2">
        <Button onClick={generateConcept} disabled={generating} className="cursor-pointer">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {generating
            ? "Gerando conceito..."
            : isApproved
              ? "Gerar conceito"
              : "Aprovar + gerar conceito"}
        </Button>
        {!isApproved && (
          <>
            <Button variant="outline" onClick={approve} disabled={generating} className="cursor-pointer">
              <Check className="h-4 w-4" aria-hidden="true" />
              Apenas aprovar
            </Button>
            <Button variant="outline" onClick={() => setShowReject(true)} disabled={generating} className="cursor-pointer">
              <X className="h-4 w-4" aria-hidden="true" />
              Rejeitar
            </Button>
          </>
        )}
        {showReject && (
          <div className="w-full mt-3 space-y-2">
            <Textarea
              placeholder="Por que essa Big Idea está sendo rejeitada?"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
            />
            <Button size="sm" variant="destructive" onClick={reject} className="cursor-pointer">
              Confirmar rejeição
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
