import { MetricCard } from "@/components/metric-card";

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return <MetricCard label={label} value={value} detail={detail} />;
}
