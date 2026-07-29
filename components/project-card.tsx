"use client";

import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";

import { usePosterSelection } from "@/components/posters-download-manager";
import { ScoreOrb } from "@/components/score-orb";
import { StatusPill } from "@/components/status-pill";

export function ProjectCard({
  codigo,
  nombre,
  linea,
  semillero,
  estado,
  score,
  updatedAt,
  requiereConexionElectrica,
  requiereMesaMobiliario,
  presentaPrototipoFuncional,
  requiereOtroElemento,
  otroElementoDescripcion,
  projectId,
  posterAvailable,
  managePosters,
}: {
  codigo: string;
  nombre: string;
  linea: string;
  semillero?: string;
  estado?: string;
  score?: number | null;
  updatedAt?: string;
  requiereConexionElectrica?: boolean;
  requiereMesaMobiliario?: boolean;
  presentaPrototipoFuncional?: boolean;
  requiereOtroElemento?: boolean;
  otroElementoDescripcion?: string;
  projectId?: string;
  posterAvailable?: boolean;
  managePosters?: boolean;
}) {
  const posterSelection = usePosterSelection();
  const requirements = [
    requiereConexionElectrica ? "Punto eléctrico" : null,
    requiereMesaMobiliario ? "Mesa/mobiliario" : null,
    presentaPrototipoFuncional ? "Prototipo funcional" : null,
    requiereOtroElemento ? `Otro${otroElementoDescripcion?.trim() ? `: ${otroElementoDescripcion.trim()}` : ""}` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <article className="expo-panel flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(23,19,33,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="expo-eyebrow">{codigo}</p>
          <h2 className="mt-3 line-clamp-2 font-heading text-2xl font-black leading-tight text-[var(--color-text)]">
            {nombre}
          </h2>
        </div>
        <ScoreOrb score={score} status={estado} size="sm" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <StatusPill status={estado} />
        {semillero ? (
          <span className="inline-flex min-h-7 items-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            {semillero}
          </span>
        ) : null}
        <span className="inline-flex min-h-7 items-center rounded-full border border-[var(--color-border)] bg-white/55 px-3 py-1 text-xs font-bold text-[var(--color-muted)]">
          {linea}
        </span>
      </div>
      <div className="mt-5 border-t border-[var(--color-border)] pt-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--color-muted)]">Requerimientos del stand</p>
        {requirements.length ? <div className="mt-2 flex flex-wrap gap-2">{requirements.map(requirement => <span key={requirement} className="inline-flex rounded-full border border-[var(--color-success)]/25 bg-[var(--color-mint)]/15 px-2.5 py-1 text-xs font-bold text-[var(--color-success)]">{requirement}</span>)}</div> : <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">Sin requerimientos especiales</p>}
      </div>
      {managePosters ? <div className="mt-4 flex min-h-10 items-center justify-between gap-3">
        {posterAvailable && projectId && posterSelection ? <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold"><input type="checkbox" checked={posterSelection.selected.has(projectId)} onChange={() => posterSelection.toggle(projectId)} />Seleccionar póster</label> : <span className="inline-flex rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-[var(--color-muted)]">Sin póster cargado</span>}
        {posterAvailable ? <a href={`/api/admin/posters/download/${encodeURIComponent(codigo)}`} className="inline-flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-xs font-bold text-[var(--color-primary)]"><Download className="size-4" />Descargar póster</a> : null}
      </div> : null}
      <div className="mt-auto pt-6">
        <p className="mb-4 text-xs font-semibold text-[var(--color-muted)]">
          Ultima actualizacion: {formatDate(updatedAt)}
        </p>
        <Link
          href={`/proyectos/${codigo}`}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
        >
          Ver proyecto
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "Sin fecha";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}
