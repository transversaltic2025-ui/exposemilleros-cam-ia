"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Assignment, Evaluator, Project } from "@/types";

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
  const [projectSearch, setProjectSearch] = useState("");
  const [evaluatorSearch, setEvaluatorSearch] = useState("");
  const [projectId, setProjectId] = useState(
    () => projects.find((project) => project.codigo_proyecto === initialProjectCode)?.id ?? "",
  );
  const [evaluatorId, setEvaluatorId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    return projects.filter((project) => !query || [
      project.codigo_proyecto, project.nombre_proyecto, project.semillero,
      project.semillero_otro, project.linea_tematica,
    ].some((value) => String(value ?? "").toLowerCase().includes(query)));
  }, [projectSearch, projects]);
  const filteredEvaluators = useMemo(() => {
    const query = evaluatorSearch.trim().toLowerCase();
    return evaluators.filter((evaluator) => !query || [
      evaluator.documento_evaluador, evaluator.nombre_evaluador, evaluator.correo_evaluador,
    ].some((value) => String(value ?? "").toLowerCase().includes(query)));
  }, [evaluatorSearch, evaluators]);
  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedProjectAssignments = assignments.filter((assignment) => assignment.proyecto_id === projectId);

  async function assign() {
    if (!projectId || !evaluatorId) return setMessage("Seleccione un proyecto y un evaluador.");
    setBusy(true);
    const response = await fetch("/api/admin/asignaciones/manual", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proyecto_id: projectId, evaluador_id: evaluatorId }),
    });
    const result = await response.json();
    setBusy(false);
    setMessage(response.ok ? "Evaluador asignado correctamente." : result.error);
    if (response.ok) router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    const response = await fetch(`/api/admin/asignaciones/${id}`, { method: "DELETE" });
    const result = await response.json();
    setBusy(false);
    setMessage(response.ok ? "Asignación quitada correctamente." : result.error);
    if (response.ok) router.refresh();
  }

  async function createEvaluator(formData: FormData) {
    setBusy(true);
    const body = Object.fromEntries(formData.entries());
    const response = await fetch("/api/admin/evaluadores", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const result = await response.json();
    setBusy(false);
    setMessage(response.ok
      ? result.created ? "Evaluador registrado correctamente." : "El evaluador ya existía y fue recuperado."
      : result.error);
    if (response.ok) {
      setEvaluatorId(result.evaluator.id);
      setShowCreate(false);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle>Asignación manual</CardTitle></CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Picker label="Seleccionar proyecto" search={projectSearch} setSearch={setProjectSearch}>
              <select className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                <option value="">Seleccione un proyecto</option>
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.codigo_proyecto} · {project.nombre_proyecto} · {project.requiere_asignacion_manual ? "Manual" : "Automática"} · {project.linea_tematica}
                  </option>
                ))}
              </select>
            </Picker>
            <Picker label="Seleccionar evaluador" search={evaluatorSearch} setSearch={setEvaluatorSearch}>
              <select className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3" value={evaluatorId} onChange={(event) => setEvaluatorId(event.target.value)}>
                <option value="">Seleccione un evaluador</option>
                {filteredEvaluators.map((evaluator) => (
                  <option key={evaluator.id} value={evaluator.id}>
                    {evaluator.nombre_evaluador} · {evaluator.documento_evaluador} · {evaluator.correo_evaluador} · {evaluator.area_conocimiento}
                  </option>
                ))}
              </select>
            </Picker>
          </div>
          {selectedProject ? (
            <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white/55 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <ProjectDatum label="Código" value={selectedProject.codigo_proyecto} />
              <ProjectDatum label="Nombre" value={selectedProject.nombre_proyecto} />
              <ProjectDatum label="Semillero" value={selectedProject.semillero === "Otro" ? selectedProject.semillero_otro : selectedProject.semillero} />
              <ProjectDatum label="Línea temática" value={selectedProject.linea_tematica} />
              <ProjectDatum label="Tipo de asignación" value={selectedProject.requiere_asignacion_manual ? "Asignación manual" : "Asignación automática"} />
              <ProjectDatum label="Cupo actual" value={String(selectedProject.requiere_asignacion_manual ? selectedProject.cupo_evaluadores_manual ?? 4 : 2)} />
              <ProjectDatum label="Evaluadores ya asignados" value={String(selectedProjectAssignments.length)} />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button onClick={assign} disabled={busy}><Plus />Asignar evaluador</Button>
            <Button variant="outline" onClick={() => setShowCreate((value) => !value)}><UserPlus />Registrar evaluador manualmente</Button>
          </div>
          {message ? <p className="rounded-xl bg-white/60 p-3 text-sm font-semibold">{message}</p> : null}
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
          {(projectId ? selectedProjectAssignments : assignments).map((assignment) => (
            <div key={assignment.id ?? assignment.asignacion_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white/50 p-4">
              <div>
                <p className="font-bold">{assignment.proyecto_codigo} · {assignment.proyecto_nombre}</p>
                <p className="text-sm text-[var(--color-muted)]">{assignment.evaluador_nombre} · Tipo de asignación: {assignment.tipo_asignacion ?? "Automática"} · {assignment.estado_asignacion ?? assignment.estado}</p>
              </div>
              {assignment.id && (assignment.estado_asignacion ?? assignment.estado) !== "Completada" ? (
                <Button variant="outline" size="sm" onClick={() => remove(assignment.id!)} disabled={busy}><Trash2 />Quitar asignación</Button>
              ) : null}
            </div>
          ))}
          {!(projectId ? selectedProjectAssignments : assignments).length ? <p className="text-sm text-[var(--color-muted)]">Aún no hay asignaciones.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Picker({ label, search, setSearch, children }: { label: string; search: string; setSearch: (value: string) => void; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label><div className="relative"><Search className="absolute left-3 top-3.5 size-4 text-[var(--color-muted)]" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." /></div>{children}</div>;
}
function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required /></div>;
}
function ProjectDatum({ label, value }: { label: string; value?: string }) {
  return <div><p className="expo-eyebrow">{label}</p><p className="mt-1 text-sm font-bold">{value || "No registrado"}</p></div>;
}
