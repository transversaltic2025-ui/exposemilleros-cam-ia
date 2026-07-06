import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="expo-panel grid place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-6 size-14 rounded-full border border-[#6D3FA9]/20 bg-[#6D3FA9]/10" />
        <h2 className="font-heading text-3xl font-black text-[var(--color-text)]">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(109,63,169,0.22)] hover:bg-[var(--color-secondary)]"
          >
            {actionLabel}
            <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
