import Link from "next/link";
import { AlertTriangle, ArrowUpRight, BarChart3, ClipboardCheck, ClipboardList, FileBadge, GitBranch, GraduationCap, Users } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { SectionShell } from "@/components/section-shell";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import { getAIAnalyses, getAssignments, getEvaluators, getHumanEvaluations, getLogisticsSummary, getProjects } from "@/lib/supabase/queries";
import { AdminLogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

const adminLinks = [
  {
    href: "/proyectos",
    title: "Proyectos",
    detail: "Consulta interna de registros y análisis.",
    icon: ClipboardCheck,
  },
  {
    href: "/tendencias",
    title: "Tendencias",
    detail: "Dashboard de tendencias IA y logistica.",
    icon: BarChart3,
  },
  {
    href: "/admin/evaluadores",
    title: "Evaluadores",
    detail: "Disponibilidad, área y carga máxima.",
    icon: Users,
  },
  {
    href: "/admin/asignaciones",
    title: "Asignaciones",
    detail: "Tokens, apertura de archivo y estado.",
    icon: GitBranch,
  },
  {
    href: "/admin/certificados",
    title: "Certificados",
    detail: "Ponentes, instructores lideres y evaluadores.",
    icon: FileBadge,
  },
  {
    href: "/admin/capacitacion-evaluadores",
    title: "Capacitación de evaluadores",
    detail: "Evaluaciones de práctica sin efecto oficial.",
    icon: GraduationCap,
  },
];

export default async function AdminPage() {
  await requireAdmin();

  const [resumenLogistica, proyectos, asignaciones, evaluaciones, analisisIA, evaluadores] = await Promise.all([
    getLogisticsSummary(),
    getProjects(),
    getAssignments(),
    getHumanEvaluations(),
    getAIAnalyses(),
    getEvaluators(),
  ]);
  const recientes = proyectos.slice(0, 4);
  const pendientes = asignaciones
    .filter((asignacion) => (asignacion.estado_asignacion ?? asignacion.estado) !== "Completada")
    .slice(0, 4);
  const scores = new Map([
    ...analisisIA.map((analysis) => [analysis.proyecto_id, analysis.puntaje_sugerido_ia ?? 0] as const),
    ...evaluaciones.map((evaluation) => [evaluation.proyecto_id, evaluation.porcentaje ?? evaluation.puntaje_total] as const),
  ]);
  const mejores = proyectos
    .map((project) => ({ project, score: scores.get(project.id ?? project.codigo) ?? 0 }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const evaluadoresConAsignacion = evaluadores.filter((evaluador) => {
    return (evaluador.cantidad_proyectos_asignados ?? evaluador.proyectos_asignados ?? 0) > 0;
  }).length;
  const evaluadoresSinAsignacion = Math.max(evaluadores.length - evaluadoresConAsignacion, 0);

  return (
    <SiteShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="expo-eyebrow">Administracion</p>
          <h1 className="expo-page-title mt-2">Panel ejecutivo personal</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Gestión operativa sin inicio de sesión tradicional: evaluadores, asignaciones, certificados y alertas de avance.
          </p>
        </div>
        <AdminLogoutButton />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Proyectos" value={resumenLogistica.proyectos} detail="Inscritos" />
        <MetricCard label="Evaluadores" value={resumenLogistica.evaluadores} detail="Registrados" accent="secondary" />
        <MetricCard label="Asignaciones" value={resumenLogistica.asignaciones} detail="Creadas" accent="mint" />
        <MetricCard label="Evaluaciones" value={resumenLogistica.evaluaciones} detail="Recibidas" accent="success" />
        <MetricCard label="Certificados" value={resumenLogistica.certificadosPendientes} detail="Pendientes" />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <MetricCard label="Electricidad" value={resumenLogistica.proyectosRequierenElectricidad ?? 0} detail="Proyectos" accent="secondary" />
        <MetricCard label="Mobiliario" value={resumenLogistica.proyectosRequierenMobiliario ?? 0} detail="Proyectos" accent="mint" />
        <MetricCard label="Prototipos" value={resumenLogistica.proyectosConPrototipoFuncional ?? 0} detail="Funcionales" accent="success" />
        <MetricCard label="Otro elemento" value={resumenLogistica.proyectosRequierenOtroElemento ?? 0} detail="Requerido" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Evaluadores registrados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total registrados" value={evaluadores.length} detail="Evaluadores" accent="secondary" />
          <MetricCard label="Con asignación" value={evaluadoresConAsignacion} detail="Tienen proyectos" accent="success" />
          <MetricCard label="Sin asignación" value={evaluadoresSinAsignacion} detail="Pendientes" accent="mint" />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {adminLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:bg-white/82">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-5 text-[var(--color-primary)]" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-4 text-sm leading-6 text-[var(--color-muted)]">
                  <span>{item.detail}</span>
                  <ArrowUpRight className="size-4 text-[var(--color-primary)]" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Proyectos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recientes.map((project) => (
              <Link key={project.codigo} href={`/proyectos/${project.codigo}`} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white/45 p-4 hover:bg-white/70">
                <div>
                  <p className="font-sans text-sm font-extrabold text-[var(--color-text)]">{project.titulo}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{project.codigo} · {project.area_conocimiento}</p>
                </div>
                <StatusPill status={project.estado} />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Evaluaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendientes.length > 0 ? pendientes.map((assignment) => (
              <Link key={assignment.id ?? assignment.asignacion_id} href={`/evaluar/${assignment.token_evaluacion ?? assignment.token}`} className="block rounded-2xl border border-[var(--color-border)] bg-white/45 p-4 hover:bg-white/70">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-sans text-sm font-extrabold text-[var(--color-text)]">{assignment.proyecto_codigo ?? assignment.codigo_proyecto ?? "Proyecto"}</p>
                  <StatusPill status={assignment.estado_asignacion ?? assignment.estado} />
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{assignment.evaluador_nombre ?? assignment.evaluador_id}</p>
              </Link>
            )) : <p className="text-sm text-[var(--color-muted)]">No hay evaluaciones pendientes.</p>}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mejores scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mejores.length > 0 ? mejores.map(({ project, score }) => (
              <div key={project.codigo} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white/45 p-4">
                <div>
                  <p className="font-sans text-sm font-extrabold text-[var(--color-text)]">{project.titulo}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{project.codigo}</p>
                </div>
                <span className="font-sans text-2xl font-extrabold text-[var(--color-primary)]">{score}</span>
              </div>
            )) : <p className="text-sm text-[var(--color-muted)]">Aún no hay puntajes registrados.</p>}
          </CardContent>
        </Card>
        <SectionShell>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-[var(--color-primary)]" />
                Alertas suaves
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Sin evaluador" value={resumenLogistica.proyectosSinEvaluador} detail="Requieren asignación" accent="mint" />
              <MetricCard label="Con 1 evaluador" value={resumenLogistica.proyectosConUnEvaluador} detail="Falta segunda mirada" accent="secondary" />
              <MetricCard label="Con 2 evaluadores" value={resumenLogistica.proyectosConDosEvaluadores} detail="Carga completa" accent="success" />
            </CardContent>
          </Card>
        </SectionShell>
      </section>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5 text-[var(--color-success)]" />
            Reglas de asignación
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-[var(--color-muted)] md:grid-cols-3">
          <p>Maximo 3 proyectos por evaluador.</p>
          <p>Maximo 2 evaluadores por proyecto.</p>
          <p>El área del proyecto y la del evaluador deben coincidir.</p>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
