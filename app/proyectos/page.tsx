import Link from "next/link";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/project-card";
import { SectionShell } from "@/components/section-shell";
import { SiteShell } from "@/components/site-shell";
import { getAIAnalyses, getHumanEvaluations, getProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
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

  return (
    <SiteShell>
      <SectionShell
        eyebrow="Portafolio publico"
        title="Proyectos registrados"
        description="Listado sin correos, documentos ni celulares. Cada ficha muestra estado, linea tematica y score disponible."
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
        {proyectos.length === 0 ? (
          <EmptyState
            title="Aun no hay proyectos evaluados"
            description="Cuando existan registros, apareceran como fichas con score, estado y acceso al detalle publico."
            actionLabel="Registrar primer proyecto"
            actionHref="/inscripcion"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {proyectos.map((proyecto) => (
              <ProjectCard
                key={proyecto.codigo}
                codigo={proyecto.codigo}
                nombre={proyecto.titulo}
                linea={proyecto.area_conocimiento}
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
