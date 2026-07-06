import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-[var(--color-border)] bg-white/60 text-[var(--color-muted)]",
  primary: "border-[#6D3FA9]/20 bg-[#6D3FA9]/10 text-[#6D3FA9]",
  progress: "border-[#A37AD9]/24 bg-[#A37AD9]/14 text-[#6D3FA9]",
  success: "border-[#2E7D5B]/20 bg-[#2E7D5B]/10 text-[#2E7D5B]",
  warning: "border-[#A37AD9]/30 bg-[#7ECF9A]/18 text-[#171321]",
};

export type StatusTone = keyof typeof toneClasses;

export function getStatusTone(status?: string): StatusTone {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized.includes("complet") || normalized.includes("generado") || normalized.includes("activo")) {
    return "success";
  }
  if (normalized.includes("asign") || normalized.includes("proceso") || normalized.includes("evalu")) {
    return "progress";
  }
  if (normalized.includes("pend") || normalized.includes("ajust") || normalized.includes("error")) {
    return "warning";
  }
  if (normalized.includes("registr")) {
    return "primary";
  }
  return "neutral";
}

export function StatusPill({
  children,
  status,
  tone,
  className,
}: {
  children?: React.ReactNode;
  status?: string;
  tone?: StatusTone;
  className?: string;
}) {
  const resolvedTone = tone ?? getStatusTone(status);

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.1em]",
        toneClasses[resolvedTone],
        className,
      )}
    >
      {children ?? status ?? "Sin estado"}
    </span>
  );
}
