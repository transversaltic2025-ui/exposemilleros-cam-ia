"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InscripcionForm, type FormValues } from "../inscripcion-form";

type Member = { rol_integrante: string; nombre_completo: string; documento: string; correo: string; celular: string; ficha: string; es_menor_edad: boolean; tratamiento_datos_menor_path: string; tratamiento_datos_menor_nombre: string; tratamiento_datos_menor_tipo: string; tratamiento_datos_menor_size: number };
type EditableProject = Record<string, unknown> & { id: string; codigo_proyecto: string; has_evaluations: boolean; integrantes: Member[] };

function formValues(project: EditableProject): Partial<FormValues> {
  const members = project.integrantes;
  const authors = members.filter((m) => m.rol_integrante === "Autor principal").slice(0, 2);
  const author = authors[0];
  const learners = members.filter((m) => m.rol_integrante === "Aprendiz participante");
  const staff = members.filter((m) => m.rol_integrante === "Instructor" || m.rol_integrante === "Investigador asociado");
  return {
    titulo: String(project.nombre_proyecto ?? ""), area_conocimiento: String(project.linea_tematica ?? ""), linea_tematica_otro: String(project.linea_tematica_otro ?? ""),
    semillero: String(project.semillero ?? ""), semillero_otro: String(project.semillero_otro ?? ""), institucion: String(project.institucion ?? ""), municipio: String(project.municipio ?? ""),
    resumen_problema: String(project.resumen_problema ?? ""), resumen_objetivo: String(project.resumen_objetivo ?? ""), resumen_metodologia: String(project.resumen_metodologia ?? ""),
    resumen_resultados: String(project.resumen_resultados ?? ""), resumen_conclusiones: String(project.resumen_conclusiones ?? ""), modalidades_proyecto: project.modalidades_proyecto as string[] ?? [],
    modalidad_otro: String(project.modalidad_otro ?? ""), modalidad_participacion: String(project.modalidad_participacion ?? ""), estado_desarrollo_proyecto: String(project.estado_desarrollo_proyecto ?? ""),
    productos_obtenidos: project.productos_obtenidos as string[] ?? [], productos_obtenidos_otro: String(project.productos_obtenidos_otro ?? ""), nivel_madurez: String(project.nivel_madurez ?? ""),
    requiere_conexion_electrica: Boolean(project.requiere_conexion_electrica), requiere_mesa_mobiliario: Boolean(project.requiere_mesa_mobiliario), presenta_prototipo_funcional: Boolean(project.presenta_prototipo_funcional),
    requiere_otro_elemento: Boolean(project.requiere_otro_elemento), otro_elemento_descripcion: String(project.otro_elemento_descripcion ?? ""), categoria_presentacion: "Poster", requiere_certificado: "Si",
    integrantes: {
      autoresPrincipales: authors.map((m) => ({ nombreCompleto: m.nombre_completo, documento: m.documento ?? "", correo: m.correo ?? "", celular: m.celular ?? "" })),
      autorPrincipal: { nombreCompleto: author?.nombre_completo ?? "", documento: author?.documento ?? "", correo: author?.correo ?? "", celular: author?.celular ?? "" },
      aprendices: learners.map((m) => ({ nombreCompleto: m.nombre_completo, documento: m.documento, correo: m.correo, celular: m.celular, ficha: m.ficha, esMenorEdad: m.es_menor_edad, tratamientoDatosMenorPath: m.tratamiento_datos_menor_path, tratamientoDatosMenorNombre: m.tratamiento_datos_menor_nombre, tratamientoDatosMenorTipo: m.tratamiento_datos_menor_tipo, tratamientoDatosMenorSize: m.tratamiento_datos_menor_size })),
      instructoresInvestigadores: staff.map((m) => ({ nombreCompleto: m.nombre_completo, documento: m.documento, correo: m.correo, celular: m.celular, rol: m.rol_integrante as "Instructor" | "Investigador asociado" })),
    },
  };
}

export function EditRegistrationAccess() {
  const [code, setCode] = useState(""); const [document, setDocument] = useState("");
  const [project, setProject] = useState<EditableProject | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function search(event: React.FormEvent) {
    event.preventDefault(); setError(null); setLoading(true);
    const response = await fetch("/api/projects/validate-edit-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo_proyecto: code, documento: document }) });
    const payload = await response.json().catch(() => null); setLoading(false);
    if (!response.ok) { setError(payload?.error ?? "No fue posible buscar el proyecto."); return; }
    setProject(payload.project);
  }
  if (project) return <InscripcionForm mode="edit" initialValues={formValues(project)} projectId={project.id} projectCode={project.codigo_proyecto} requesterDocument={document} hasEvaluations={project.has_evaluations} />;
  return <form className="grid max-w-xl gap-5" onSubmit={search}>
    <div className="grid gap-2"><Label htmlFor="edit-code">Código del proyecto</Label><Input id="edit-code" value={code} onChange={(e) => setCode(e.target.value)} required /></div>
    <div className="grid gap-2"><Label htmlFor="edit-document">Número de documento del autor principal o integrante registrado</Label><Input id="edit-document" value={document} onChange={(e) => setDocument(e.target.value)} required /></div>
    {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    <Button type="submit" disabled={loading}>{loading ? "Buscando…" : "Buscar proyecto"}</Button>
  </form>;
}
