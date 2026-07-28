"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProjectCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-7 rounded-2xl border-2 border-[var(--color-primary)] bg-violet-50/70 p-5 sm:p-6">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary)]">Código del proyecto</p>
      <p className="mt-3 break-all font-heading text-3xl font-black tracking-wide text-[var(--color-text)] sm:text-4xl">{code}</p>
      <Button type="button" variant="outline" className="mt-5" onClick={copyCode}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        Copiar código
      </Button>
      {copied ? <p className="mt-3 text-sm font-bold text-[var(--color-success)]">Código copiado correctamente.</p> : null}
    </div>
  );
}
