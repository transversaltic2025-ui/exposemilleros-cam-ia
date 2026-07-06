import { cn } from "@/lib/utils";

export function SectionShell({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      {(eyebrow || title || description || action) ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? <p className="expo-eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="mt-2 font-heading text-3xl font-black text-[var(--color-text)]">{title}</h2> : null}
            {description ? <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
