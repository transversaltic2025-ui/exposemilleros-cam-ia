"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ProjectAdminDownloads({ visibleProjectIds, hasActiveFilters }: { visibleProjectIds: string[]; hasActiveFilters: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function downloadFilteredParticipants() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/projects/participants/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: visibleProjectIds }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "No fue posible generar la descarga.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "participantes-proyectos-filtrados.xlsx"; link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible generar la descarga.");
    } finally { setBusy(false); }
  }

  const linkClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-[var(--color-primary)]";
  return <section className="expo-panel mb-6 bg-white p-5">
    <h2 className="font-heading text-xl font-black">Descargas administrativas</h2>
    <p className="mt-2 text-sm text-[var(--color-muted)]">Descargue bases de datos y reportes administrativos de los proyectos registrados.</p>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <a href="/api/admin/projects/participants/export/excel" className={linkClass}><Download className="size-4" />Descargar participantes por proyecto</a>
      {hasActiveFilters && <button type="button" disabled={busy || !visibleProjectIds.length} onClick={() => void downloadFilteredParticipants()} className={`${linkClass} disabled:opacity-40`}><Download className="size-4" />{busy ? "Preparando..." : "Descargar participantes del filtro"}</button>}
      <a href="/api/admin/projects/requirements/export/excel" className={linkClass}><Download className="size-4" />Descargar requerimientos logísticos</a>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </section>;
}
