import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renderer canônico de markdown do app — usa prose customizado
 * com a paleta da marca King. Suporta GFM (tabelas, checklists, etc).
 */
export function MarkdownProse({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm md:prose-base max-w-none",
        // Headings — Bricolage Grotesque via font-display var
        "prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-3xl prose-h1:mt-0 prose-h1:mb-4",
        "prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b",
        "prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2",
        "prose-h4:text-base prose-h4:mt-5 prose-h4:mb-1 prose-h4:uppercase prose-h4:tracking-wider prose-h4:text-muted-foreground prose-h4:text-xs",
        // Body
        "prose-p:text-foreground/85 prose-p:leading-relaxed",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-foreground/90",
        // Links
        "prose-a:text-brand-blue prose-a:no-underline prose-a:font-medium hover:prose-a:underline hover:prose-a:underline-offset-4",
        // Lists
        "prose-ul:my-3 prose-ol:my-3",
        "prose-li:my-1 prose-li:text-foreground/85",
        "prose-li:marker:text-brand-coral",
        // Code
        "prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.85em] prose-code:font-mono prose-code:before:hidden prose-code:after:hidden prose-code:font-medium",
        "prose-pre:bg-sidebar prose-pre:text-sidebar-foreground prose-pre:border prose-pre:border-sidebar-border prose-pre:rounded-xl",
        // Blockquote
        "prose-blockquote:border-l-4 prose-blockquote:border-brand-coral prose-blockquote:bg-brand-coral/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-foreground",
        // Tables
        "prose-table:text-sm",
        "prose-thead:border-b prose-thead:border-border prose-th:font-semibold prose-th:text-foreground prose-th:py-2",
        "prose-td:py-2 prose-td:border-b prose-td:border-border/50",
        // HR
        "prose-hr:border-border",
        // Dark
        "dark:prose-invert",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
