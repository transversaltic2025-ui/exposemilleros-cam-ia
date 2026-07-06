import Link from "next/link";
import { ArrowRight, Bot, ClipboardCheck, FileText, Sparkles, Users } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { ProjectCard } from "@/components/project-card";
import { SectionShell } from "@/components/section-shell";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAIAnalyses, getHumanEvaluations, getLogisticsSummary, getProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [resumenLogistica, proyectos, evaluaciones, analisisIA] = await Promise.all([
    getLogisticsSummary(),
    getProjects(),
    getHumanEvaluations(),
    getAIAnalyses(),
  ]);
  const completedEvaluations = evaluaciones.length;
  const completedAI = analisisIA.filter((analysis) => analysis.estado_analisis === "Completado" || analysis.estado === "Completado");
  const activeProjects = proyectos.filter((project) => !String(project.estado).toLowerCase().includes("cerr")).length;
  const aiScoresByProject = new Map(completedAI.map((analysis) => [analysis.proyecto_id, analysis.puntaje_sugerido_ia]));
  const humanScoresByProject = new Map(evaluaciones.map((evaluation) => [evaluation.proyecto_id, evaluation.porcentaje ?? evaluation.puntaje_total]));
  const projectScore = (projectId?: string, code?: string) =>
    (projectId ? aiScoresByProject.get(projectId) ?? humanScoresByProject.get(projectId) : undefined) ??
    (code ? aiScoresByProject.get(code) ?? humanScoresByProject.get(code) : undefined) ??
    null;
  const destacados = proyectos
    .map((project) => ({
      project,
      score: projectScore(project.id, project.codigo),
    }))
    .filter((item) => typeof item.score === "number")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);
  const pendientes = proyectos
    .filter((project) => {
      const estado = `${project.estado} ${project.estado_evaluacion_humana ?? ""} ${project.estado_analisis_ia ?? ""}`.toLowerCase();
      return estado.includes("pend") || project.evaluadores_asignados < 2;
    })
    .slice(0, 4);

  return (
    <SiteShell>
      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="space-y-6">
          <p className="expo-eyebrow">ExpoInnovacion y CampeSENA</p>
          <div className="space-y-4">
            <h1 className="expo-page-title max-w-4xl">Panel vivo de investigacion aplicada CAM 2026</h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--color-muted)]">
              Estado operativo de proyectos, evaluaciones humanas, analisis IA, tendencias y certificados.
              La primera vista muestra lo que requiere seguimiento inmediato.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/inscripcion"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(109,63,169,0.22)] hover:bg-[var(--color-secondary)]"
            >
              <FileText className="size-4" />
              Inscribir proyecto
            </Link>
            <Link
              href="/evaluadores/registro"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/70 px-5 text-sm font-bold text-[var(--color-text)] hover:bg-white"
            >
              <Users className="size-4" />
              Registrar evaluador
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--color-primary)]" />
              Lectura ejecutiva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Activos", `${activeProjects} proyectos en circulacion`],
              ["Evaluados", `${completedEvaluations} evaluaciones humanas recibidas`],
              ["Con IA", `${completedAI.length} analisis IA completados`],
              ["Pendientes", `${resumenLogistica.asignacionesPendientes ?? 0} asignaciones por cerrar`],
            ].map(([title, detail]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-white/48 p-3">
                <ArrowRight className="mt-1 size-4 text-[var(--color-primary)]" />
                <div>
                  <div className="font-sans font-extrabold text-[var(--color-text)]">{title}</div>
                  <div className="text-sm text-[var(--color-muted)]">{detail}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-4">
        <MetricCard label="Proyectos activos" value={activeProjects} detail="Registrados y visibles para operacion" />
        <MetricCard label="Evaluaciones completadas" value={completedEvaluations} detail="Conceptos humanos guardados" accent="success" />
        <MetricCard label="Analisis IA" value={completedAI.length} detail="Proyectos leidos por IA" accent="secondary" />
        <MetricCard label="Pendientes" value={resumenLogistica.asignacionesPendientes ?? 0} detail="Asignaciones o revisiones abiertas" accent="mint" />
      </section>

      <SectionShell className="mt-12" eyebrow="Seguimiento" title="Proyectos destacados">
        <div className="grid gap-5 md:grid-cols-3">
          {destacados.length > 0
            ? destacados.map(({ project, score }) => (
                <ProjectCard
                  key={project.codigo}
                  codigo={project.codigo}
                  nombre={project.titulo}
                  linea={project.area_conocimiento}
                  estado={project.estado}
                  score={score}
                  updatedAt={project.updated_at ?? project.created_at ?? project.fecha_registro}
                />
              ))
            : proyectos.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project.codigo}
                  codigo={project.codigo}
                  nombre={project.titulo}
                  linea={project.area_conocimiento}
                  estado={project.estado}
                  score={projectScore(project.id, project.codigo)}
                  updatedAt={project.updated_at ?? project.created_at ?? project.fecha_registro}
                />
              ))}
        </div>
      </SectionShell>

      <section className="mt-12 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[var(--color-success)]" />
              Pendientes o estancados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendientes.length > 0 ? pendientes.map((project) => (
              <Link
                key={project.codigo}
                href={`/proyectos/${project.codigo}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white/48 p-4 hover:bg-white/70"
              >
                <div>
                  <p className="font-sans text-sm font-extrabold text-[var(--color-text)]">{project.titulo}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{project.codigo} · {project.area_conocimiento}</p>
                </div>
                <StatusPill status={project.estado_analisis_ia ?? project.estado_evaluacion_humana ?? project.estado} />
              </Link>
            )) : <p className="text-sm text-[var(--color-muted)]">No hay proyectos pendientes en este momento.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5 text-[var(--color-primary)]" />
              Motor de evaluacion
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
            <p>Evaluacion humana por token, sin login tradicional ni sistema de contrasenas.</p>
            <p>Analisis IA del archivo con resumen, tendencias, puntaje sugerido y concepto IA.</p>
            <p>Comparacion directa entre criterio humano y lectura automatizada.</p>
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
