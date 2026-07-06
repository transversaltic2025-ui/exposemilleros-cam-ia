"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileBadge } from "lucide-react";

import { Button } from "@/components/ui/button";

type CertificateType = "Participante" | "Ponente" | "Instructor" | "Evaluador";

export function GenerateCertificateButton({
  tipoCertificado,
  label,
}: {
  tipoCertificado: CertificateType;
  label: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    setIsLoading(true);
    setMessage(null);

    const response = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo_certificado: tipoCertificado }),
    });
    const payload = await response.json().catch(() => null);

    setIsLoading(false);
    if (!response.ok) {
      setMessage(payload?.error ?? "No se pudieron generar certificados.");
      return;
    }

    setMessage(
      `${payload.generados ?? 0} generados, ${payload.omitidos_por_duplicado ?? 0} duplicados omitidos.`,
    );
    router.refresh();
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
