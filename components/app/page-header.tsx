import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Header trang với motif "dây đàn" nhuộm theo màu nhạc cụ (--inst). */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  accent,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <header
      style={accent ? ({ "--inst": accent } as CSSProperties) : undefined}
      className={cn("relative isolate overflow-hidden pb-6 pt-2", className)}
    >
      <div aria-hidden className="strings-motif pointer-events-none absolute inset-x-0 top-0 -z-10 h-full opacity-70" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--inst)]">{eyebrow}</p>
          )}
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
          {description && <p className="max-w-2xl text-pretty text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </header>
  );
}
