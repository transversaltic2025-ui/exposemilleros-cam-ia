import Link from "next/link";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/project-card";
import { PostersDownloadManager } from "@/components/posters-download-manager";
import { ProjectAdminDownloads } from "@/components/project-admin-downloads";
import { SectionShell } from "@/components/section-shell";
import { SemilleroFilter } from "@/components/semillero-filter";
import { StandRequirementsFilter, type StandRequirement } from "@/components/stand-requirements-filter";
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
  searchParams: Promise<{ semillero?: string | string[]; requerimiento?: string | string[]; requerimientos?: string | string[] }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const requestedSemillero = Array.isArray(params.semillero) ? params.semillero[0] : params.semillero;
  const selectedSemillero =
    requestedSemillero && SEMILLEROS_FILTER_OPTIONS.includes(requestedSemillero)
      ? requestedSemillero
      : "";
  const rawRequirements = [
    ...(Array.isArray(params.requerimientos) ? params.requerimientos : [params.requerimientos]),
    ...(Array.isArray(params.requerimiento) ? params.requerimiento : [params.requerimiento]),
  ].filter((value): value is string => Boolean(value)).flatMap(value => value.split(","));
  const allowedRequirements = new Set<StandRequirement>(["electricidad", "mobiliario", "prototipo", "otro"]);
  const selectedRequirements = [...new Set(rawRequirements.filter((value): value is StandRequirement => allowedRequirements.has(value as StandRequirement)))];

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
  const semilleroProjects = selectedSemillero
    ? proyectos.filter((proyecto) => proyecto.semillero === selectedSemillero)
    : proyectos;
  const matchesRequirement = (project: (typeof proyectos)[number]) => selectedRequirements.some(requirement =>
    (requirement === "electricidad" && project.requiere_conexion_electrica) ||
    (requirement === "mobiliario" && project.requiere_mesa_mobiliario) ||
    (requirement === "prototipo" && project.presenta_prototipo_funcional) ||
    (requirement === "otro" && project.requiere_otro_elemento)
  );
  const filteredProjects = selectedRequirements.length
    ? semilleroProjects.filter(matchesRequirement)
    : semilleroProjects;
  const requirementsSummary = {
    electricidad: proyectos.filter(project => project.requiere_conexion_electrica).length,
    mobiliario: proyectos.filter(project => project.requiere_mesa_mobiliario).length,
    prototipo: proyectos.filter(project => project.presenta_prototipo_funcional).length,
    otro: proyectos.filter(project => project.requiere_otro_elemento).length,
  };
  const hasFilters = Boolean(selectedSemillero || selectedRequirements.length);
  const totalPosterCount = proyectos.filter(project => Boolean(project.poster_proyecto_path)).length;
  const visiblePosterIds = filteredProjects
    .filter(project => Boolean(project.poster_proyecto_path && project.id))
    .map(project => project.id as string);
  const visibleProjectIds = filteredProjects.filter(project => Boolean(project.id)).map(project => project.id as string);

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
        <StandRequirementsFilter selected={selectedRequirements} />

        <div className="expo-panel mb-6 p-5">
          <h2 className="font-heading text-xl font-black">Resumen de requerimientos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <p className="rounded-xl bg-white/55 p-3 text-sm"><b>Proyectos con punto eléctrico:</b> {requirementsSummary.electricidad}</p>
            <p className="rounded-xl bg-white/55 p-3 text-sm"><b>Proyectos con mesa o mobiliario:</b> {requirementsSummary.mobiliario}</p>
            <p className="rounded-xl bg-white/55 p-3 text-sm"><b>Proyectos con prototipo funcional:</b> {requirementsSummary.prototipo}</p>
            <p className="rounded-xl bg-white/55 p-3 text-sm"><b>Proyectos con otro elemento requerido:</b> {requirementsSummary.otro}</p>
          </div>
        </div>

        <ProjectAdminDownloads visibleProjectIds={visibleProjectIds} hasActiveFilters={hasFilters} />

        <PostersDownloadManager totalPosterCount={totalPosterCount} visiblePosterIds={visiblePosterIds}>
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--color-muted)]">
            {hasFilters ? "Mostrando proyectos según los filtros seleccionados." : "Mostrando todos los proyectos registrados."}
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
              {selectedRequirements.length ? "No hay proyectos registrados con estos requerimientos." : "No hay proyectos registrados para este semillero."}
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
                requiereConexionElectrica={proyecto.requiere_conexion_electrica}
                requiereMesaMobiliario={proyecto.requiere_mesa_mobiliario}
                presentaPrototipoFuncional={proyecto.presenta_prototipo_funcional}
                requiereOtroElemento={proyecto.requiere_otro_elemento}
                otroElementoDescripcion={proyecto.otro_elemento_descripcion}
                projectId={proyecto.id}
                posterAvailable={Boolean(proyecto.poster_proyecto_path)}
                managePosters
              />
            ))}
          </div>
        )}
        </PostersDownloadManager>
      </SectionShell>
    </SiteShell>
  );
}
