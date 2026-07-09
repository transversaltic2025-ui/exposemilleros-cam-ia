import Link from "next/link";

import { MetricCard } from "@/components/metric-card";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEvaluatorAssignmentsByAccessToken } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function MisAsignacionesEvaluadorPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { evaluator, assignments, evaluations, assignmentOpen } = await getEvaluatorAssignmentsByAccessToken(token);

  if (!evaluator) {
    return (
      <SiteShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-10 text-center">
            <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">
              Enlace de evaluador no válido.
            </h1>
          </CardContent>
        </Card>
      </SiteShell>
    );
  }

  const completedAssignments = assignments.filter(isCompletedAssignment);
  const pendingAssignments = assignments.filter((assignment) => !isCompletedAssignment(assignment));
  const nextAssignment = pendingAssignments.find((assignment) => assignment.permitir_edicion !== false);
  const allCompleted = assignments.length > 0 && pendingAssignments.length === 0;
  const averageScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, evaluation) => sum + (evaluation.puntaje_total ?? 0), 0) / evaluations.length)
    : 0;

  return (
    <SiteShell>
      <div className="mb-8">
        <p className="expo-eyebrow">Evaluador</p>
        <h1 className="expo-page-title mt-2">Mis proyectos asignados</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          Guarda este enlace para continuar después.
        </p>
        <div className="mt-4 grid gap-3 text-sm text-[var(--color-muted)] md:grid-cols-3">
          <Info label="Nombre" value={evaluator.nombre_evaluador ?? evaluator.nombre ?? "Evaluador"} />
          <Info label="Código" value={evaluator.codigo_evaluador ?? evaluator.evaluador_id ?? "Sin código"} />
          <Info label="Área" value={evaluator.area_conocimiento ?? "Sin área"} />
        </div>
      </div>

      {assignmentOpen === false ? (
        <Card className="mb-6 border-[#2E7D5B]/25 bg-[#2E7D5B]/10">
          <CardContent className="py-6">
            <p className="text-sm leading-6 text-[var(--color-text)]">
              Su registro como evaluador está activo. Los proyectos serán asignados automáticamente a partir del 5 de
              agosto de 2026 a las 00:00, hora Colombia, de acuerdo con su área de conocimiento.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {allCompleted ? (
        <Card className="mb-6 border-[#2E7D5B]/25 bg-[#2E7D5B]/10">
          <CardContent className="py-6">
            <h2 className="font-heading text-2xl font-black text-[#2E7D5B]">
              Has terminado todas tus evaluaciones asignadas. Gracias por completar el proceso.
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MetricCard label="Evaluaciones completadas" value={completedAssignments.length} detail="Proceso finalizado" accent="success" />
              <MetricCard label="Promedio otorgado" value={averageScore} detail="Puntaje total promedio" accent="mint" />
            </div>
            <div className="mt-5">
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--color-muted)]">Proyectos evaluados</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-text)]">
                {evaluations.slice(0, 5).map((evaluation) => (
                  <li key={evaluation.id ?? evaluation.evaluacion_id ?? evaluation.asignacion_id}>
                    {evaluation.proyecto_nombre ?? evaluation.proyecto_id}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : assignments.length > 0 ? (
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Tienes evaluaciones pendientes. Puedes continuar con el siguiente proyecto asignado.
            </p>
            {nextAssignment ? (
              <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]" href={nextAssignment.url_evaluacion || `/evaluar/${nextAssignment.token_evaluacion ?? nextAssignment.token}`}>
                Continuar con la siguiente evaluación
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Proyectos asignados" value={assignments.length} detail="Total" />
        <MetricCard label="Evaluaciones completadas" value={completedAssignments.length} detail="Finalizadas" accent="success" />
        <MetricCard label="Evaluaciones pendientes" value={pendingAssignments.length} detail="Por completar" accent="secondary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asignaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {assignmentOpen === false
                ? "Aún no tienes proyectos asignados porque la asignación automática no ha sido habilitada."
                : "No tienes proyectos disponibles asignados en este momento."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Línea temática</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => {
                  const completed = isCompletedAssignment(assignment);
                  const canEdit = assignment.permitir_edicion !== false && !completed;
                  const evaluationUrl = assignment.url_evaluacion || `/evaluar/${assignment.token_evaluacion ?? assignment.token}`;

                  return (
                    <TableRow key={assignment.id ?? assignment.asignacion_id}>
                      <TableCell>{assignment.proyecto_codigo ?? assignment.codigo_proyecto ?? assignment.proyecto_id}</TableCell>
                      <TableCell className="whitespace-normal">
                        {assignment.proyecto_nombre ?? assignment.titulo_proyecto ?? "Proyecto asignado"}
                      </TableCell>
                      <TableCell>{assignment.proyecto_area ?? assignment.area_conocimiento ?? "Sin línea"}</TableCell>
                      <TableCell>
                        <StatusPill status={assignment.estado_asignacion ?? assignment.estado ?? "Pendiente"} />
                      </TableCell>
                      <TableCell>{formatDate(assignment.fecha_asignacion)}</TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Link className="inline-flex h-10 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]" href={evaluationUrl}>
                            Evaluar proyecto
                          </Link>
                        ) : (
                          <span className="inline-flex h-10 items-center rounded-xl bg-white/70 px-4 text-sm font-bold text-[var(--color-muted)]">
                            Evaluación completada
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {evaluations.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resumen de evaluaciones realizadas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id ?? evaluation.evaluacion_id ?? evaluation.asignacion_id} className="rounded-2xl border border-[var(--color-border)] bg-white/55 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-sans text-base font-extrabold text-[var(--color-text)]">
                      {evaluation.proyecto_nombre ?? evaluation.proyecto_id}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{formatDate(evaluation.created_at ?? evaluation.fecha_envio)}</p>
                  </div>
                  <div className="text-sm font-bold text-[var(--color-text)]">
                    Puntaje {evaluation.puntaje_total ?? 0} · {evaluation.porcentaje ?? 0}% · {evaluation.nivel_tendencia ?? "Sin nivel"}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  {truncate(evaluation.concepto_evaluador ?? "Sin concepto registrado.", 180)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </SiteShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white/60 p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function isCompletedAssignment(assignment: { estado_asignacion?: string; estado?: string }) {
  return assignment.estado_asignacion === "Completada" || assignment.estado === "Completada";
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
