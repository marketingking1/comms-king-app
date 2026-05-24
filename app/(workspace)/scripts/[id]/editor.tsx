"use client";

import { useState, useTransition } from "react";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { MarkdownProse } from "@/components/markdown-prose";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Sparkles, Check, Pencil, Eye, Hash, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  scriptId: string;
  initialRichContent?: string;
  initialMarkdown: string;
  initialCaption: string;
  initialHashtags: string;
};

export function ScriptEditor({
  scriptId,
  initialRichContent,
  initialMarkdown,
  initialCaption,
  initialHashtags,
}: Props) {
  const supabase = createSupabaseBrowserClient();
  const [richContent, setRichContent] = useState<object | null>(null);
  const [text, setText] = useState(initialMarkdown);
  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit">("view"); // default = view bonito

  function save() {
    startTransition(async () => {
      const { error } = await supabase
        .from("scripts")
        .update({
          rich_content: richContent ?? undefined,
          raw_markdown: text,
          caption,
          hashtags: hashtags.split(/\s+/).filter((h) => h.startsWith("#")),
          updated_at: new Date().toISOString(),
        })
        .eq("id", scriptId);
      if (error) toast.error(error.message);
      else {
        toast.success("Roteiro salvo");
        setMode("view"); // volta pra view depois de salvar
      }
    });
  }

  function approve() {
    startTransition(async () => {
      const { error } = await supabase
        .from("scripts")
        .update({ status: "approved" })
        .eq("id", scriptId);
      if (error) toast.error(error.message);
      else toast.success("Roteiro aprovado");
    });
  }

  async function generateEditBrief() {
    const tid = toast.loading("Rodando comms-edit-director...", { duration: Infinity });
    try {
      const res = await fetch("/api/agents/comms-edit-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Roteiro pronto pra edição:\n\n${text}\n\nCaption:\n${caption}\n\nProduza brief detalhado de edição pra editora humana da King. Preencha TODOS os campos do template (espec técnica, estilo, corte a corte, sound, legendas, thumb, referências, checklist).`,
          relatedEntityType: "script",
          relatedEntityId: scriptId,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        let detail = body;
        try { detail = JSON.parse(body).error || body; } catch { /* texto puro */ }
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
      if (!acc.trim()) throw new Error("Agente respondeu vazio (erro mid-stream provável)");
      await supabase.from("edit_briefs").insert({
        script_id: scriptId,
        raw_markdown: acc,
        status: "waiting",
      });
      toast.success("Brief de edição gerado", { id: tid, duration: 4000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 300) : "Erro", { id: tid, duration: 8000 });
    }
  }

  return (
    <div className="space-y-5">
      {/* ROTEIRO — VIEW/EDIT TOGGLE */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-coral" />
              Roteiro publicável
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-lg border bg-card p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    mode === "view"
                      ? "bg-accent text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver
                </button>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    mode === "edit"
                      ? "bg-accent text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>
              {mode === "edit" && (
                <Button variant="outline" size="sm" onClick={save} disabled={isPending} className="cursor-pointer">
                  <Save className="h-4 w-4" />
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={generateEditBrief} className="cursor-pointer">
                <Sparkles className="h-4 w-4" />
                Gerar brief edição
              </Button>
              <Button size="sm" onClick={approve} disabled={isPending} className="cursor-pointer">
                <Check className="h-4 w-4" />
                Aprovar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={mode === "view" ? "p-6 lg:p-8" : "p-3"}>
          {mode === "view" ? (
            text.trim() ? (
              <MarkdownProse markdown={text} />
            ) : (
              <p className="text-sm text-muted-foreground italic py-8 text-center">
                Roteiro vazio. Clique em <strong className="text-foreground">Editar</strong> pra começar.
              </p>
            )
          ) : (
            <TiptapEditor
              initialContent={initialRichContent}
              initialMarkdown={initialMarkdown}
              onChange={(json, plain) => {
                setRichContent(json);
                setText(plain);
              }}
              placeholder="Roteiro publicável..."
            />
          )}
        </CardContent>
      </Card>

      {/* CAPTION + HASHTAGS */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-blue" />
            Caption + hashtags
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="caption" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Caption (1ª linha vira hook)
            </Label>
            <Textarea
              id="caption"
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Linha 1 = hook (≤125 char)"
              className="font-sans leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {caption.length} caracteres
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              Hashtags (separe por espaço)
            </Label>
            <Input
              id="tags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#inglesparaprofissionais #carreirainternacional ..."
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
