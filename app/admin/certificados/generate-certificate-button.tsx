"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileBadge } from "lucide-react";

import { Button } from "@/components/ui/button";

type CertificateType = "Ponente" | "Líder de proyecto" | "Evaluador" | "Evaluador productores campesinos";

export function GenerateCertificateButton({
  tipoCertificado,
  label,
  overwrite = false,
}: {
  tipoCertificado: CertificateType | "Todos";
  label: string;
  overwrite?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    if (overwrite && !window.confirm("Esto reemplazará los certificados existentes usando la plantilla y posiciones actuales.")) return;
    setIsLoading(true);
    setMessage(null);
    const types: CertificateType[] = tipoCertificado === "Todos"
      ? ["Ponente", "Líder de proyecto", "Evaluador", "Evaluador productores campesinos"]
      : [tipoCertificado];
    let generated = 0;
    let regenerated = 0;
    let skipped = 0;
    let successMessage = "";
    try {
      for (const type of types) {
        const response = await fetch("/api/certificates/generate", {
          method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo_certificado: type, overwrite }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error ?? "No se pudieron generar certificados.");
        generated += payload.generados ?? 0;
        regenerated += payload.regenerados ?? 0;
        skipped += payload.omitidos_por_duplicado ?? 0;
        successMessage = payload.message || successMessage;
      }
      setMessage(tipoCertificado !== "Todos" && successMessage
        ? successMessage
        : `${generated} generados, ${regenerated} regenerados, ${skipped} omitidos.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron generar certificados.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" onClick={generate} disabled={isLoading} className="justify-start">
        <FileBadge className="size-4" />
        {isLoading ? "Generando..." : label}
      </Button>
      {message ? <p className="text-xs font-semibold text-[var(--color-muted)]">{message}</p> : null}
    </div>
  );
}
