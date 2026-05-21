"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Table as TableIcon, Undo, Redo } from "lucide-react";
import { useEffect } from "react";

type Props = {
  initialContent?: string;
  initialMarkdown?: string;
  onChange?: (json: object, text: string) => void;
  placeholder?: string;
};

export function TiptapEditor({ initialContent, initialMarkdown, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || "Comece a editar..." }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent ? JSON.parse(initialContent) : markdownToHtml(initialMarkdown ?? ""),
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON(), editor.getText());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    return () => editor.destroy();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex gap-1 flex-wrap bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-accent" : ""}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-accent" : ""}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-accent" : ""}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-accent" : ""}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 5, cols: 4, withHeaderRow: true }).run()
          }
        >
          <TableIcon className="h-3.5 w-3.5" />
        </Button>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_th]:bg-muted"
      />
      <div className="border-t px-3 py-1.5 text-xs text-muted-foreground flex justify-between bg-muted/30">
        <span>{editor.storage.characterCount.characters()} caracteres</span>
        <span>{editor.storage.characterCount.words()} palavras</span>
      </div>
    </div>
  );
}

// Conversor primitivo Markdown → HTML pro initial state.
// Substituir por unified+remark futuramente se precisar fidelidade.
function markdownToHtml(md: string): string {
  if (!md) return "";
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .split("\n\n")
    .map((p) => (p.startsWith("<h") ? p : `<p>${p.replace(/\n/g, "<br>")}</p>`))
    .join("");
}
