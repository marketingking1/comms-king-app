import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renderer canônico de markdown. Usa classe .kol-prose definida
 * em globals.css (não dependemos do @tailwindcss/typography que
 * tem incompatibilidades com Tailwind v4).
 */
export function MarkdownProse({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div className={cn("kol-prose", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
