import { cn } from "@/lib/utils";

type ScoreTone = "focus" | "progress" | "healthy" | "attention";

const toneMap: Record<ScoreTone, { color: string; soft: string; label: string }> = {
  focus: { color: "#6D3FA9", soft: "rgba(109, 63, 169, 0.16)", label: "Foco alto" },
  progress: { color: "#A37AD9", soft: "rgba(163, 122, 217, 0.2)", label: "En evaluacion" },
  healthy: { color: "#2E7D5B", soft: "rgba(46, 125, 91, 0.16)", label: "Saludable" },
  attention: { color: "#7ECF9A", soft: "rgba(126, 207, 154, 0.22)", label: "Requiere atencion" },
};

function getTone(score?: number | null, status?: string): ScoreTone {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized.includes("pend") || normalized.includes("proceso") || normalized.includes("asign")) {
    return "progress";
  }
  if (typeof score !== "number") {
    return "attention";
  }
  if (score >= 88) {
    return "focus";
  }
  if (score >= 70) {
    return "healthy";
  }
  return "attention";
}

export function ScoreOrb({
  score,
  status,
  label,
  size = "md",
  className,
}: {
  score?: number | null;
  status?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const safeScore = typeof score === "number" && Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
  const tone = getTone(safeScore, status);
  const toneConfig = toneMap[tone];
  const degrees = safeScore === null ? 34 : Math.round(safeScore * 3.6);
  const dimensions = size === "lg" ? "size-40" : size === "sm" ? "size-24" : "size-32";
  const valueClass = size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-4xl";

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full border border-white/70 shadow-[0_22px_44px_rgba(23,19,33,0.12)]",
          dimensions,
        )}
        style={{
          background: `conic-gradient(${toneConfig.color} 0deg ${degrees}deg, ${toneConfig.soft} ${degrees}deg 360deg)`,
        }}
        aria-label={`${label ?? toneConfig.label}: ${safeScore ?? 0} de 100`}
      >
        <div className="absolute inset-[9%] rounded-full bg-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" />
        <div
          className="absolute -right-1 top-1/4 size-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: tone === "attention" ? "#7ECF9A" : toneConfig.color }}
        />
        <div className="relative text-center">
          <div className={cn("font-sans font-extrabold leading-none text-[var(--color-text)]", valueClass)}>
            {safeScore ?? "--"}
          </div>
          <div className="mt-1 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {label ?? toneConfig.label}
          </div>
        </div>
      </div>
    </div>
  );
}
