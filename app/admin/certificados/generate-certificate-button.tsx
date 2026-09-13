"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileBadge } from "lucide-react";

import { Button } from "@/components/ui/button";

type CertificateType = "Ponente" | "Líder de proyecto" | "Evaluador" | "Evaluador productores campesinos" | "Investigador";

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
      ? ["Ponente", "Líder de proyecto", "Evaluador", "Evaluador productores campesinos", "Investigador"]
      : [tipoCertificado];
    let generated = 0;
    let regenerated = 0;
    let skipped = 0;
    let errors = 0;
    const details: string[] = [];
    try {
      const typeMap = { "Ponente": "ponentes", "Líder de proyecto": "lideres", "Evaluador": "evaluadores", "Evaluador productores campesinos": "evaluadores-productores", "Investigador": "investigadores" } as const;
      for (const type of types) {
        let offset = 0;
        let remaining = 1;
        setMessage(`${overwrite ? "Regenerando" : "Generando"} ${type.toLowerCase()}: ${offset} procesados...`);
        while (remaining > 0) {
          let response: Response;
          let text: string;
          try {
            response = await fetch("/api/admin/certificados/generar", {
              method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tipo: typeMap[type], regenerate: overwrite, offset, limit: 25 }),
            });
            text = await response.text();
          } catch {
            throw new Error("No fue posible conectar con la API de certificados. Revise los logs de Vercel.");
          }
          let payload;
          try { payload = JSON.parse(text); } catch {
            throw new Error(text || `La API de certificados devolvió una respuesta vacía (HTTP ${response.status}).`);
          }
          if (!response.ok || payload?.success !== true) throw new Error(payload?.message || payload?.error || text);
          if (!Number.isInteger(payload.nextOffset) || !Number.isInteger(payload.remaining) || payload.remaining < 0 ||
              (payload.remaining > 0 && payload.nextOffset <= offset)) throw new Error("La API devolvió un progreso de lote inválido.");
          generated += payload.generados ?? 0;
          regenerated += payload.regenerados ?? 0;
          skipped += payload.omitidos ?? 0;
          errors += payload.errores ?? 0;
          for (const detail of payload.erroresDetalle ?? []) {
            if (details.length < 5) details.push(`${detail.nombre}: ${detail.motivo}`);
          }
          offset = payload.nextOffset;
          remaining = payload.remaining;
          setMessage(`${overwrite ? "Regenerando" : "Generando"} ${type.toLowerCase()} ${offset} de ${payload.total}`);
        }
      }
      setMessage(`${generated} generados, ${regenerated} regenerados, ${skipped} omitidos, ${errors} errores.${details.length ? " " + details.join("; ") : ""}`);
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
      {message ? <p role="status" aria-live="polite" className="text-xs font-semibold text-[var(--color-muted)]">{message}</p> : null}
    </div>
  );
}
