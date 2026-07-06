import { cn } from "@/lib/utils";

export function CriteriaWeight({
  label,
  value,
  max = 100,
  detail,
  className,
}: {
  label: string;
  value?: number | null;
  max?: number;
  detail?: string;
  className?: string;
}) {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
  const percent = max > 0 ? Math.min(100, Math.round((safeValue / max) * 100)) : 0;

  return (
    <div className={cn("rounded-2xl border border-[var(--color-border)] bg-white/52 p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-sm font-extrabold text-[var(--color-text)]">{label}</p>
          {detail ? <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{detail}</p> : null}
        </div>
        <span className="font-sans text-lg font-extrabold text-[var(--color-primary)]">{safeValue}/{max}</span>
      </div>
      <div className="mt-4 grid grid-cols-12 gap-1.5" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-2 rounded-full",
              index < Math.round(percent / 8.34) ? "bg-[var(--color-primary)]" : "bg-[rgba(23,19,33,0.08)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}
