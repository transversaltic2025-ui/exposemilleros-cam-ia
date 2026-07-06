import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  accent = "primary",
  className,
}: {
  label: string;
  value: string | number;
  detail?: string;
  accent?: "primary" | "secondary" | "success" | "mint";
  className?: string;
}) {
  const accentClass = {
    primary: "bg-[#6D3FA9]",
    secondary: "bg-[#A37AD9]",
    success: "bg-[#2E7D5B]",
    mint: "bg-[#7ECF9A]",
  }[accent];

  return (
    <div className={cn("expo-panel p-5", className)}>
      <div className={cn("mb-5 h-1.5 w-12 rounded-full", accentClass)} />
      <p className="expo-eyebrow">{label}</p>
      <div className="mt-3 font-sans text-3xl font-extrabold leading-none text-[var(--color-text)]">{value}</div>
      {detail ? <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{detail}</p> : null}
    </div>
  );
}
