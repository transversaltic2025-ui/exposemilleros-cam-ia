import Link from "next/link";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/project-card";
import { SectionShell } from "@/components/section-shell";
import { SemilleroFilter } from "@/components/semillero-filter";
import { SiteShell } from "@/components/site-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { getAIAnalyses, getHumanEvaluations, getProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const SEMILLEROS_FILTER_OPTIONS = [
  "Cienciatec",
  "AgroadminLab",
  "Aspillanos",
  "Tecnobioma",
  "Administrativo Naranjos",
  "Nido",
  "Pecuario",
  "Agrícola",
  "Ambiental",
  "Napecam",
  "Sibari",
  "Otro",
];

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ semillero?: string | string[] }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const requestedSemillero = Array.isArray(params.semillero) ? params.semillero[0] : params.semillero;
  const selectedSemillero =
    requestedSemillero && SEMILLEROS_FILTER_OPTIONS.includes(requestedSemillero)
      ? requestedSemillero
      : "";

  const [proyectos, evaluaciones, analisisIA] = await Promise.all([
    getProjects(),
    getHumanEvaluations(),
    getAIAnalyses(),
  ]);
  const aiScoresByProject = new Map(
    analisisIA
      .filter((analysis) => analysis.estado_analisis === "Completado" || analysis.estado === "Completado")
      .map((analysis) => [analysis.proyecto_id, analysis.puntaje_sugerido_ia]),
  );
  const humanScoresByProject = new Map(evaluaciones.map((evaluation) => [evaluation.proyecto_id, evaluation.porcentaje ?? evaluation.puntaje_total]));
  const getScore = (id?: string, codigo?: string) =>
    (id ? aiScoresByProject.get(id) ?? humanScoresByProject.get(id) : undefined) ??
    (codigo ? aiScoresByProject.get(codigo) ?? humanScoresByProject.get(codigo) : undefined) ??
    null;
  const filteredProjects = selectedSemillero
    ? proyectos.filter((proyecto) => proyecto.semillero === selectedSemillero)
    : proyectos;

  return (
    <SiteShell>
      <SectionShell
        eyebrow="Panel interno"
        title="Proyectos registrados"
        description="Consulta interna de proyectos registrados, estados de evaluación y análisis disponibles."
        action={
          <Link
            href="/inscripcion"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
          >
            <Plus className="size-4" />
            Registrar primer proyecto
          </Link>
        }
      >
        <SemilleroFilter selectedSemillero={selectedSemillero} />

        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--color-muted)]">
            {selectedSemillero
              ? `Mostrando proyectos del semillero: ${selectedSemillero}.`
              : "Mostrando todos los proyectos registrados."}
          </p>
          <p className="text-sm font-bold text-[var(--color-text)]">
            {filteredProjects.length} {filteredProjects.length === 1 ? "proyecto encontrado." : "proyectos encontrados."}
          </p>
        </div>

        {proyectos.length === 0 ? (
          <EmptyState
            title="Aún no hay proyectos evaluados"
            description="Cuando existan registros, aparecerán como fichas internas con estado y análisis disponible."
            actionLabel="Registrar primer proyecto"
            actionHref="/inscripcion"
          />
        ) : filteredProjects.length === 0 ? (
          <div className="expo-panel px-6 py-10 text-center">
            <h2 className="font-heading text-xl font-black text-[var(--color-text)]">
              No hay proyectos registrados para este semillero.
            </h2>
            <Link
              href="/proyectos"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
            >
              Ver todos los proyectos
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((proyecto) => (
              <ProjectCard
                key={proyecto.codigo}
                codigo={proyecto.codigo}
                nombre={proyecto.titulo}
                linea={proyecto.area_conocimiento}
                semillero={
                  proyecto.semillero === "Otro" && proyecto.semillero_otro
                    ? `Otro: ${proyecto.semillero_otro}`
                    : proyecto.semillero
                }
                estado={proyecto.estado_analisis_ia ?? proyecto.estado_evaluacion_humana ?? proyecto.estado}
                score={getScore(proyecto.id, proyecto.codigo)}
                updatedAt={proyecto.updated_at ?? proyecto.created_at ?? proyecto.fecha_registro}
              />
            ))}
          </div>
        )}
      </SectionShell>
    </SiteShell>
  );
}
