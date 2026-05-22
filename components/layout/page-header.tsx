import type { ReactNode } from "react";

/**
 * Header padrão das páginas internas — título + descrição + ações à direita.
 * Mantém ritmo visual consistente entre rotas.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-1.5">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-base max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
