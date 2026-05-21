"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function IdeaActions({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [generating, setGenerating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

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

      const res = await fetch("/api/agents/comms-storyteller-viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Big Idea aprovada pra gerar conceito narrativo:\n\n${idea?.raw_markdown}\n\nAplique o processo de 6 etapas e gere o conceito narrativo completo em markdown. Use Hero Brand + 3 Regras + STEPPS.`,
          relatedEntityType: "big_idea",
          relatedEntityId: ideaId,
        }),
      });

      if (!res.ok) throw new Error("Erro ao gerar conceito");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }

      // Salva concept
      const modelMatch = acc.match(/Framework:\s*\*?\*?\s*([A-Za-z\-\s]+)/);
      const { data: concept } = await supabase
        .from("concepts")
        .insert({
          big_idea_id: ideaId,
          narrative_model: modelMatch ? modelMatch[1].trim().slice(0, 100) : "auto",
          status: "draft",
          raw_markdown: acc,
        })
        .select()
        .single();

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
        <Button onClick={generateConcept} disabled={generating}>
          <Sparkles className="h-4 w-4" />
          {generating ? "Gerando conceito..." : "Aprovar + gerar conceito"}
        </Button>
        <Button variant="outline" onClick={approve} disabled={generating}>
          <Check className="h-4 w-4" />
          Apenas aprovar
        </Button>
        <Button variant="outline" onClick={() => setShowReject(true)} disabled={generating}>
          <X className="h-4 w-4" />
          Rejeitar
        </Button>
        {showReject && (
          <div className="w-full mt-3 space-y-2">
            <Textarea
              placeholder="Por que essa Big Idea está sendo rejeitada?"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
            />
            <Button size="sm" variant="destructive" onClick={reject}>
              Confirmar rejeição
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
