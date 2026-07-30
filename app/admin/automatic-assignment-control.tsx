"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Summary = {
  evaluadoresActivos: number;
  evaluadoresConProyectoAntes: number;
  evaluadoresSinProyectoAntes: number;
  evaluadoresReparados: number;
  evaluadoresSinProyectoDespues: number;
  proyectosUsadosEnReparacion: number;
  evaluadoresConProyecto: number;
  evaluadoresSinProyecto: number;
  proyectosProcesados: number;
  proyectosConDosEvaluadores: number;
  proyectosConUnEvaluador: number;
  proyectosSinEvaluadores: number;
  asignacionesCreadas: number;
  asignacionesExistentesRespetadas: number;
  detalleEvaluadoresSinProyecto: Array<{ evaluador: string; documento: string; area: string; motivo: string }>;
  detalleProyectosSinEvaluadores: Array<{ proyecto: string; motivo: string }>;
};

type EvaluatorWithoutProject = { id: string; nombre: string; documento: string; area: string };

export function AutomaticAssignmentControl({
  initialEnabled,
  initialEvaluatorsWithoutProject = [],
}: {
  initialEnabled: boolean;
  initialEvaluatorsWithoutProject?: EvaluatorWithoutProject[];
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState<"toggle" | "generate" | "repair" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  async function toggle() {
    const nextEnabled = !enabled;
    setLoading("toggle");
    setMessage("");
    setError("");
    const response = await fetch("/api/admin/settings/asignacion-proyectos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: nextEnabled }),
    });
    const payload = await response.json().catch(() => null);
    setLoading(null);
    if (!response.ok) {
      setError(payload?.error ?? "No fue posible actualizar la asignación automática.");
      return;
    }
    setEnabled(payload.enabled);
    setMessage(payload.enabled ? "Asignación automática activada." : "La asignación automática está desactivada.");
  }

  async function runAssignments(mode: "generate" | "repair") {
    if (!enabled) {
      setError("La asignación automática está desactivada.");
      return;
    }
    setLoading(mode);
    setMessage("");
    setError("");
    setSummary(null);
    const response = await fetch("/api/admin/asignaciones/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const payload = await response.json().catch(() => null);
    setLoading(null);
    if (!response.ok) {
      setError(payload?.error ?? "No fue posible generar las asignaciones.");
      return;
    }
    setSummary(payload);
    setMessage(
      payload.asignacionesCreadas > 0
        ? mode === "repair"
          ? "Asignaciones reparadas correctamente."
          : "Asignaciones generadas correctamente."
        : payload.message,
    );
    router.refresh();
  }

  return (
    <Card className="mt-6 bg-white/75">
      <CardHeader>
        <CardTitle>Asignación automática de proyectos</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">
          Active o desactive la asignación automática de proyectos de investigación a evaluadores.
        </p>
        <p className="text-sm font-semibold text-[var(--color-text)]">
          La asignación automática prioriza que todos los evaluadores activos reciban al menos un proyecto y luego
          completa los proyectos hasta dos evaluadores.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-white/60 p-4 md:flex-row md:items-center md:justify-between">
          <StatusPill status={enabled ? "Asignación automática activa" : "Asignación automática desactivada"} />
          <div className="flex flex-wrap gap-3">
            <Button variant={enabled ? "outline" : "default"} disabled={loading !== null} onClick={toggle}>
              {loading === "toggle"
                ? "Guardando..."
                : enabled
                  ? "Desactivar asignación automática"
                  : "Activar asignación automática"}
            </Button>
            <Button disabled={loading !== null || !enabled} onClick={() => runAssignments("generate")}>
              {loading === "generate" ? "Generando..." : "Generar asignaciones ahora"}
            </Button>
            <Button
              variant="outline"
              disabled={loading !== null || !enabled}
              onClick={() => runAssignments("repair")}
            >
              {loading === "repair" ? "Reparando..." : "Reparar asignaciones"}
            </Button>
          </div>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Asigna un proyecto a evaluadores activos que aún no tienen proyectos, sin duplicar asignaciones existentes.
        </p>
        {initialEvaluatorsWithoutProject.length > 0 && !summary ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="font-extrabold text-amber-900">Hay evaluadores activos sin proyectos asignados.</p>
            <p className="mt-1 text-sm text-amber-800">
              Evaluadores sin proyecto: {initialEvaluatorsWithoutProject.length}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {initialEvaluatorsWithoutProject.slice(0, 8).map((evaluator) => (
                <li key={evaluator.id}>
                  {evaluator.nombre} · {evaluator.documento || "Sin documento"} · {evaluator.area || "Sin área"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {summary ? (
          <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white/60 p-4">
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <SummaryItem value={summary.evaluadoresActivos} label="Evaluadores activos" />
              <SummaryItem value={summary.evaluadoresConProyectoAntes} label="Evaluadores con proyectos antes" />
              <SummaryItem value={summary.evaluadoresSinProyectoAntes} label="Evaluadores sin proyecto antes" />
              <SummaryItem value={summary.evaluadoresReparados} label="Evaluadores reparados" />
              <SummaryItem value={summary.evaluadoresSinProyectoDespues} label="Evaluadores que siguen sin proyecto" />
              <SummaryItem value={summary.proyectosUsadosEnReparacion} label="Proyectos usados en reparación" />
              <SummaryItem value={summary.evaluadoresConProyecto} label="Evaluadores con al menos 1 proyecto" />
              <SummaryItem value={summary.evaluadoresSinProyecto} label="Evaluadores sin proyecto" />
              <SummaryItem value={summary.proyectosProcesados} label="Proyectos automáticos procesados" />
              <SummaryItem value={summary.proyectosConDosEvaluadores} label="Proyectos con 2 evaluadores" />
              <SummaryItem value={summary.proyectosConUnEvaluador} label="Proyectos con 1 evaluador" />
              <SummaryItem value={summary.proyectosSinEvaluadores} label="Proyectos sin evaluadores" />
              <SummaryItem value={summary.asignacionesCreadas} label="Asignaciones creadas en esta ejecución" />
              <SummaryItem value={summary.asignacionesExistentesRespetadas} label="Asignaciones existentes respetadas" />
            </div>
            {summary.detalleEvaluadoresSinProyecto.length > 0 ? (
              <DetailList
                title="Evaluadores sin proyecto"
                items={summary.detalleEvaluadoresSinProyecto.map(
                  (item) =>
                    `${item.evaluador} · ${item.documento || "Sin documento"} · ${item.area || "Sin área"}: ${item.motivo}`,
                )}
              />
            ) : null}
            {summary.detalleProyectosSinEvaluadores.length > 0 ? (
              <DetailList
                title="Proyectos sin evaluadores"
                items={summary.detalleProyectosSinEvaluadores.map((item) => `${item.proyecto}: ${item.motivo}`)}
              />
            ) : null}
          </div>
        ) : null}
        {message ? <p className="text-sm font-semibold text-green-700">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function SummaryItem({ value, label }: { value: number; label: string }) {
  return <p><strong className="text-base">{value}</strong> {label}</p>;
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-extrabold">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-muted)]">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
