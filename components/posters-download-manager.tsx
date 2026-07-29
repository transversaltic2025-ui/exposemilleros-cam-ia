"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Download } from "lucide-react";

type PosterSelectionContextValue = {
  selected: Set<string>;
  toggle: (id: string) => void;
};
const PosterSelectionContext = createContext<PosterSelectionContextValue | null>(null);

export function usePosterSelection() {
  return useContext(PosterSelectionContext);
}

async function downloadPackage(projectIds: string[], kind: "seleccionados" | "filtrados") {
  const response = await fetch("/api/admin/posters/package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectIds, kind }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message || "No fue posible descargar los pósters.");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `posters-${kind}.zip`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}

export function PostersDownloadManager({
  totalPosterCount,
  visiblePosterIds,
  children,
}: {
  totalPosterCount: number;
  visiblePosterIds: string[];
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const visibleSelected = visiblePosterIds.length > 0 && visiblePosterIds.every(id => selected.has(id));
  const packages = Math.ceil(totalPosterCount / 20);
  const value = useMemo(() => ({
    selected,
    toggle: (id: string) => setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    }),
  }), [selected]);

  function selectVisible() {
    setSelected(current => {
      const next = new Set(current);
      if (visibleSelected) visiblePosterIds.forEach(id => next.delete(id));
      else visiblePosterIds.forEach(id => next.add(id));
      return next;
    });
  }

  async function run(ids: string[], kind: "seleccionados" | "filtrados") {
    if (!ids.length) return;
    setError(""); setBusy(kind);
    try { await downloadPackage(ids, kind); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No fue posible descargar los pósters."); }
    finally { setBusy(""); }
  }

  return <PosterSelectionContext.Provider value={value}>
    <section className="expo-panel mb-6 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="font-heading text-xl font-black">Descarga de pósters</h2>
          {totalPosterCount ? <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--color-muted)]"><p>Total de proyectos con póster: <b className="text-[var(--color-text)]">{totalPosterCount}</b></p><p>Pósters visibles con el filtro actual: <b className="text-[var(--color-text)]">{visiblePosterIds.length}</b></p><p>Pósters seleccionados: <b className="text-[var(--color-text)]">{selected.size}</b></p></div> : <p className="mt-2 text-sm text-[var(--color-muted)]">No hay pósters cargados para descargar.</p>}
        </div>
        {visiblePosterIds.length > 0 && <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold"><input type="checkbox" checked={visibleSelected} onChange={selectVisible} />Seleccionar pósters visibles</label>}
      </div>
      {totalPosterCount > 0 && <div className="mt-5 flex flex-wrap gap-2">
        <button disabled={!selected.size || Boolean(busy)} onClick={() => void run([...selected], "seleccionados")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white disabled:opacity-40"><Download className="size-4" />{busy === "seleccionados" ? "Preparando..." : "Descargar seleccionados"}</button>
        <button disabled={!visiblePosterIds.length || Boolean(busy)} onClick={() => void run(visiblePosterIds, "filtrados")} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-[var(--color-primary)] disabled:opacity-40"><Download className="size-4" />{busy === "filtrados" ? "Preparando..." : "Descargar pósters del filtro"}</button>
        <details className="relative">
          <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-[var(--color-primary)]"><Download className="size-4" />Descargar todos por paquetes</summary>
          <div className="absolute right-0 z-20 mt-2 min-w-72 rounded-xl border bg-white p-2 shadow-xl">
            {Array.from({ length: packages }, (_, index) => {
              const start = index * 20 + 1;
              const end = Math.min((index + 1) * 20, totalPosterCount);
              return <a key={index} href={`/api/admin/posters/package?offset=${index * 20}&limit=20`} className="block rounded-lg px-3 py-2 text-sm font-bold hover:bg-[var(--color-secondary)]/10">Paquete {index + 1}: pósters {start} al {end}</a>;
            })}
          </div>
        </details>
      </div>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
    {children}
  </PosterSelectionContext.Provider>;
}
