"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Assignment, Evaluator, Project } from "@/types";

const normalize = (value: unknown) =>
  String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const countsForCapacity = (assignment: Assignment) =>
  !["cancelada", "eliminada", "anulada"].includes(
    normalize(assignment.estado_asignacion ?? assignment.estado),
  );

export function ManualAssignmentManager({
  projects,
  evaluators,
  assignments,
  initialProjectCode,
}: {
  projects: Project[];
  evaluators: Evaluator[];
  assignments: Assignment[];
  initialProjectCode?: string;
}) {
  const router = useRouter();
  const initialProject = projects.find(
    (project) => normalize(project.codigo_proyecto) === normalize(initialProjectCode),
  );
  const [projectSearch, setProjectSearch] = useState(
    initialProject ? `${initialProject.codigo_proyecto} · ${initialProject.nombre_proyecto}` : "",
  );
  const [evaluatorSearch, setEvaluatorSearch] = useState("");
  const [projectId, setProjectId] = useState(initialProject?.id ?? "");
  const [evaluatorId, setEvaluatorId] = useState("");
  const [currentAssignments, setCurrentAssignments] = useState(assignments);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [projectResultsOpen, setProjectResultsOpen] = useState(false);
  const [evaluatorResultsOpen, setEvaluatorResultsOpen] = useState(false);

  useEffect(() => setCurrentAssignments(assignments), [assignments]);

  const projectResults = useMemo(() => {
    const query = normalize(projectSearch);
    if (query.length < 2 || !projectResultsOpen) return [];
    return projects.filter((project) =>
      [
        project.codigo_proyecto,
        project.nombre_proyecto,
        project.semillero,
        project.semillero_otro,
        project.linea_tematica,
        project.municipio,
      ].some((value) => normalize(value).includes(query)),
    ).slice(0, 12);
  }, [projectResultsOpen, projectSearch, projects]);

  const evaluatorResults = useMemo(() => {
    const query = normalize(evaluatorSearch);
    if (query.length < 2 || !evaluatorResultsOpen) return [];
    return evaluators.filter((evaluator) =>
      [
        evaluator.nombre_evaluador,
        evaluator.documento_evaluador,
        evaluator.correo_evaluador,
        evaluator.area_conocimiento,
        evaluator.codigo_evaluador,
      ].some((value) => normalize(value).includes(query)),
    ).slice(0, 12);
  }, [evaluatorResultsOpen, evaluatorSearch, evaluators]);

  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedEvaluator = evaluators.find((evaluator) => evaluator.id === evaluatorId);
  const selectedProjectAssignments = currentAssignments.filter(
    (assignment) => assignment.proyecto_id === projectId && countsForCapacity(assignment),
  );
  const selectedEvaluatorAssignments = currentAssignments.filter(
    (assignment) => assignment.evaluador_id === evaluatorId && countsForCapacity(assignment),
  );

  function selectProject(project: Project) {
    setProjectId(project.id ?? "");
    setProjectSearch(`${project.codigo_proyecto} · ${project.nombre_proyecto}`);
    setProjectResultsOpen(false);
    setMessage(null);
  }

  function selectEvaluator(evaluator: Evaluator) {
    setEvaluatorId(evaluator.id ?? "");
    setEvaluatorSearch(`${evaluator.nombre_evaluador} · ${evaluator.documento_evaluador}`);
    setEvaluatorResultsOpen(false);
    setMessage(null);
  }

  async function assign() {
    if (!projectId || !evaluatorId) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/asignaciones/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proyectoId: projectId, evaluadorId: evaluatorId }),
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "No fue posible crear la asignación." });
      return;
    }
    setCurrentAssignments((items) => [
      {
        ...result.asignacion,
        proyecto_codigo: selectedProject?.codigo_proyecto,
        proyecto_nombre: selectedProject?.nombre_proyecto,
        evaluador_nombre: selectedEvaluator?.nombre_evaluador,
      },
      ...items,
    ]);
    setEvaluatorId("");
    setEvaluatorSearch("");
    setMessage({ type: "success", text: "Evaluador asignado correctamente." });
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/admin/asignaciones/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "No fue posible quitar la asignación." });
      return;
    }
    setCurrentAssignments((items) => items.filter((assignment) => assignment.id !== id));
    setMessage({ type: "success", text: "Asignación quitada correctamente." });
    router.refresh();
  }

  async function createEvaluator(formData: FormData) {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/evaluadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setMessage({ type: "error", text: result?.error ?? "No fue posible guardar el evaluador." });
      return;
    }
    setEvaluatorId(result.evaluator.id);
    setEvaluatorSearch(`${result.evaluator.nombre_evaluador} · ${result.evaluator.documento_evaluador}`);
    setShowCreate(false);
    setMessage({
      type: "success",
      text: result.created ? "Evaluador registrado correctamente." : "El evaluador ya existía y fue recuperado.",
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle>Asignación manual</CardTitle></CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <SearchPicker
              label="Seleccionar proyecto"
              value={projectSearch}
              placeholder="Código, nombre, semillero, línea o municipio"
              onChange={(value) => {
                setProjectSearch(value);
                setProjectId("");
                setProjectResultsOpen(true);
              }}
            >
              {projectSearch.trim().length >= 2 && projectResultsOpen ? (
                <ResultList emptyMessage="No se encontraron proyectos con esa búsqueda.">
                  {projectResults.map((project) => {
                    const count = currentAssignments.filter(
                      (assignment) => assignment.proyecto_id === project.id && countsForCapacity(assignment),
                    ).length;
                    const limit = project.requiere_asignacion_manual
                      ? project.cupo_evaluadores_manual ?? 4
                      : 2;
                    const assignmentStatus = count >= limit
                      ? "Cupo completo"
                      : count > 0
                        ? "Asignación parcial"
                        : "Sin asignaciones";
                    return (
                      <button key={project.id} type="button" onClick={() => selectProject(project)} className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-left hover:border-[var(--color-primary)] hover:bg-white/80">
                        <p className="font-extrabold">{project.codigo_proyecto} · {project.nombre_proyecto}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {project.semillero === "Otro" ? project.semillero_otro : project.semillero} · {project.linea_tematica} · {assignmentStatus} · {count} evaluador(es)
                        </p>
                      </button>
                    );
                  })}
                </ResultList>
              ) : null}
            </SearchPicker>

            <SearchPicker
              label="Seleccionar evaluador"
              value={evaluatorSearch}
              placeholder="Nombre, documento, correo, área o código"
              onChange={(value) => {
                setEvaluatorSearch(value);
                setEvaluatorId("");
                setEvaluatorResultsOpen(true);
              }}
            >
              {evaluatorSearch.trim().length >= 2 && evaluatorResultsOpen ? (
                <ResultList
                  emptyMessage="No se encontraron evaluadores con esa búsqueda."
                  footer={<Link href="/admin/evaluadores" className="text-sm font-bold text-[var(--color-primary)]">Crear evaluador</Link>}
                >
                  {evaluatorResults.map((evaluator) => {
                    const count = currentAssignments.filter(
                      (assignment) => assignment.evaluador_id === evaluator.id && countsForCapacity(assignment),
                    ).length;
                    return (
                      <button key={evaluator.id} type="button" onClick={() => selectEvaluator(evaluator)} className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-left hover:border-[var(--color-primary)] hover:bg-white/80">
                        <p className="font-extrabold">{evaluator.nombre_evaluador} · {evaluator.documento_evaluador}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {evaluator.codigo_evaluador ?? "Sin código"} · {evaluator.area_conocimiento || "Sin área"} · {count} proyecto(s) · {evaluator.estado_evaluador ?? evaluator.estado ?? "Activo"}
                        </p>
                      </button>
                    );
                  })}
                </ResultList>
              ) : null}
            </SearchPicker>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {selectedProject ? (
              <SummaryCard title="Proyecto seleccionado">
                <Datum label="Código" value={selectedProject.codigo_proyecto} />
                <Datum label="Nombre" value={selectedProject.nombre_proyecto} />
                <Datum label="Semillero" value={selectedProject.semillero === "Otro" ? selectedProject.semillero_otro : selectedProject.semillero} />
                <Datum label="Línea temática" value={String(selectedProject.linea_tematica)} />
                <Datum label="Municipio" value={selectedProject.municipio} />
                <Datum label="Evaluadores asignados" value={String(selectedProjectAssignments.length)} />
              </SummaryCard>
            ) : null}
            {selectedEvaluator ? (
              <SummaryCard title="Evaluador seleccionado">
                <Datum label="Nombre" value={selectedEvaluator.nombre_evaluador} />
                <Datum label="Documento" value={selectedEvaluator.documento_evaluador} />
                <Datum label="Código" value={selectedEvaluator.codigo_evaluador} />
                <Datum label="Área" value={String(selectedEvaluator.area_conocimiento)} />
                <Datum label="Estado" value={selectedEvaluator.estado_evaluador ?? selectedEvaluator.estado ?? "Activo"} />
                <Datum label="Proyectos asignados" value={String(selectedEvaluatorAssignments.length)} />
              </SummaryCard>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={assign} disabled={busy || !projectId || !evaluatorId}>
              <UserPlus />{busy ? "Asignando..." : "Asignar evaluador al proyecto"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate((value) => !value)}>
              <UserPlus />Registrar evaluador manualmente
            </Button>
          </div>
          {message ? (
            <p className={`rounded-xl p-3 text-sm font-semibold ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message.text}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {showCreate ? (
        <Card>
          <CardHeader><CardTitle>Registrar evaluador manualmente</CardTitle></CardHeader>
          <CardContent>
            <form action={createEvaluator} className="grid gap-4 md:grid-cols-2">
              <Field name="nombre_evaluador" label="Nombre completo" />
              <Field name="documento_evaluador" label="Documento" />
              <Field name="correo_evaluador" label="Correo" type="email" />
              <Field name="celular_evaluador" label="Celular" />
              <Field name="area_conocimiento" label="Área de conocimiento" />
              <div className="flex items-end"><Button type="submit" disabled={busy}>Guardar evaluador</Button></div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Evaluadores asignados</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {(projectId ? selectedProjectAssignments : currentAssignments).map((assignment) => (
            <div key={assignment.id ?? assignment.asignacion_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white/50 p-4">
              <div>
                <p className="font-bold">{assignment.proyecto_codigo} · {assignment.proyecto_nombre}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {assignment.evaluador_nombre} · {assignment.tipo_asignacion ?? "Automática"} · {assignment.estado_asignacion ?? assignment.estado}
                </p>
              </div>
              {assignment.id && !["Completada", "Finalizada"].includes(assignment.estado_asignacion ?? assignment.estado ?? "") ? (
                <Button variant="outline" size="sm" onClick={() => remove(assignment.id!)} disabled={busy}>
                  <Trash2 />Quitar asignación
                </Button>
              ) : null}
            </div>
          ))}
          {!(projectId ? selectedProjectAssignments : currentAssignments).length ? (
            <p className="text-sm text-[var(--color-muted)]">Aún no hay asignaciones.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SearchPicker({ label, value, placeholder, onChange, children }: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid gap-2">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3.5 size-4 text-[var(--color-muted)]" />
        <Input className="pl-9" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </div>
      {children}
    </div>
  );
}

function ResultList({ children, emptyMessage, footer }: {
  children: React.ReactNode[];
  emptyMessage: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl">
      {children.length ? children : <p className="p-3 text-sm text-[var(--color-muted)]">{emptyMessage}</p>}
      {footer ? <div className="border-t border-[var(--color-border)] p-3">{footer}</div> : null}
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white/55 p-4">
      <p className="font-heading text-lg font-black">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Datum({ label, value }: { label: string; value?: string }) {
  return <div><p className="expo-eyebrow">{label}</p><p className="mt-1 text-sm font-bold">{value || "No registrado"}</p></div>;
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required /></div>;
}
