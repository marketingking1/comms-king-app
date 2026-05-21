"use client";

import { useState, useTransition } from "react";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Sparkles, Check } from "lucide-react";
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
      else toast.success("Roteiro salvo");
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
    toast.info("Rodando comms-edit-director...");
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
      if (!res.ok) throw new Error("Erro");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      await supabase.from("edit_briefs").insert({
        script_id: scriptId,
        raw_markdown: acc,
        status: "waiting",
      });
      toast.success("Brief de edição gerado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Roteiro (editor inline)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={save} disabled={isPending}>
                <Save className="h-4 w-4" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" size="sm" onClick={generateEditBrief}>
                <Sparkles className="h-4 w-4" />
                Gerar brief edição
              </Button>
              <Button size="sm" onClick={approve} disabled={isPending}>
                <Check className="h-4 w-4" />
                Aprovar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            initialContent={initialRichContent}
            initialMarkdown={initialMarkdown}
            onChange={(json, plain) => {
              setRichContent(json);
              setText(plain);
            }}
            placeholder="Roteiro publicável..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Caption + hashtags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (1ª linha vira hook)</Label>
            <Textarea
              id="caption"
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Linha 1 = hook (≤125 char)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Hashtags (separe por espaço)</Label>
            <Input
              id="tags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#inglesparaprofissionais #carreirainternacional ..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
