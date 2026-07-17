import { NextResponse } from "next/server";
import { z } from "zod";

import { documentBelongsToProject, normalizeDocument } from "@/lib/project-edit";
import { getProjectByCodigo, getProjectMembers } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProjectEditingEnabled } from "@/lib/system-config";
import { validateMinorConsentMetadata, validatePosterMetadata } from "@/lib/upload-limits";
import type { ProjectTeamPayload } from "@/types/project";

const PROJECT_EDITING_CLOSED_MESSAGE = "La edición pública de inscripciones se encuentra cerrada.";
const EDIT_ACCESS_ERROR = "No encontramos un proyecto con ese código y documento registrado.";

const member = z.object({
  nombreCompleto: z.string().trim().min(3), documento: z.string().trim().min(5),
  correo: z.string().email(), celular: z.string().trim().min(7), ficha: z.string().optional(),
  esMenorEdad: z.boolean().optional(), tratamientoDatosMenorPath: z.string().optional(),
  tratamientoDatosMenorNombre: z.string().optional(), tratamientoDatosMenorTipo: z.string().optional(),
  tratamientoDatosMenorSize: z.number().optional(),
});
const teamSchema = z.object({
  autorPrincipal: z.object({ nombreCompleto: z.string().trim().min(3), documento: z.string().optional(), correo: z.string().email(), celular: z.string().trim().min(7) }),
  aprendices: z.array(member).min(1, "Seleccione al menos un aprendiz participante."),
  instructoresInvestigadores: z.array(member.extend({ rol: z.enum(["Instructor", "Investigador asociado"]) })).default([]),
});
const updateSchema = z.object({
  proyecto_id: z.string().min(1), codigo_proyecto: z.string().min(1), documento_solicitante: z.string().min(1),
  titulo: z.string().trim().min(5), area_conocimiento: z.string().min(1), linea_tematica_otro: z.string().optional(),
  semillero: z.string().min(1), semillero_otro: z.string().optional(), institucion: z.string().min(2), municipio: z.string().min(2),
  resumen_problema: z.string().min(10), resumen_objetivo: z.string().min(10), resumen_metodologia: z.string().min(10),
  resumen_resultados: z.string().min(10), resumen_conclusiones: z.string().min(10), modalidades_proyecto: z.array(z.string()).min(1),
  modalidad_otro: z.string().optional(), modalidad_participacion: z.string().optional(), estado_desarrollo_proyecto: z.string().min(1),
  productos_obtenidos: z.array(z.string()).min(1), productos_obtenidos_otro: z.string().optional(), nivel_madurez: z.string().min(1),
  integrantes: teamSchema, poster_proyecto_path: z.string().optional(), poster_proyecto_nombre: z.string().optional(),
  poster_proyecto_tipo: z.string().optional(), poster_proyecto_size: z.number().optional(), requiere_conexion_electrica: z.boolean(),
  requiere_mesa_mobiliario: z.boolean(), presenta_prototipo_funcional: z.boolean(), requiere_otro_elemento: z.boolean(),
  otro_elemento_descripcion: z.string().optional(), observacion: z.string().max(1000).optional(),
});

type UpdateStep = "validación de acceso" | "actualización de proyecto" | "actualización de integrantes" | "historial de edición";
class RegistrationUpdateError extends Error {
  constructor(message: string, readonly step: UpdateStep, readonly status = 500) { super(message); }
}
function safeError(error: unknown) {
  if (!error || typeof error !== "object") return error;
  const value = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
  return { message: value.message, code: value.code, details: value.details, hint: value.hint };
}
function logStep(step: UpdateStep, error: unknown, projectId?: string) {
  console.error("Error update-registration:", { step, projectId, error: safeError(error) });
}

function legacy(team: ProjectTeamPayload) {
  const result: Record<string, string | null> = {};
  for (let i = 0; i < 3; i++) {
    const learner = team.aprendices[i];
    for (const [key, value] of Object.entries({ nombre: learner?.nombreCompleto, documento: learner?.documento, correo: learner?.correo, celular: learner?.celular, ficha: learner?.ficha })) {
      result[`aprendiz_${i + 1}_${key}`] = value?.trim() || null;
    }
  }
  const instructors = team.instructoresInvestigadores.filter((item) => item.rol === "Instructor");
  for (let i = 0; i < 3; i++) {
    const instructor = instructors[i]; const prefix = i === 0 ? "instructor" : `instructor_${i + 1}`;
    for (const [key, value] of Object.entries({ nombre: instructor?.nombreCompleto, documento: instructor?.documento, correo: instructor?.correo, celular: instructor?.celular })) {
      result[`${prefix}_${key}`] = value?.trim() || null;
    }
  }
  return result;
}

export async function POST(request: Request) {
  try {
    if (!(await isProjectEditingEnabled())) {
      console.error("Error update-registration:", { step: "validación de acceso", reason: "public-editing-disabled" });
      return NextResponse.json({ error: PROJECT_EDITING_CLOSED_MESSAGE }, { status: 403 });
    }
    const values = updateSchema.parse(await request.json());
    const project = await getProjectByCodigo(values.codigo_proyecto);
    if (!project?.id || project.id !== values.proyecto_id) return NextResponse.json({ error: EDIT_ACCESS_ERROR }, { status: 404 });
    const previousMembers = await getProjectMembers(project.id);
    if (!documentBelongsToProject(project, previousMembers, values.documento_solicitante)) return NextResponse.json({ error: EDIT_ACCESS_ERROR }, { status: 404 });

    const previousConsent = new Map(previousMembers.filter((item) => item.rol_integrante === "Aprendiz participante").map((item) => [normalizeDocument(item.documento), item]));
    for (const learner of values.integrantes.aprendices) {
      const old = previousConsent.get(normalizeDocument(learner.documento));
      if (learner.esMenorEdad && (!learner.tratamientoDatosMenorPath || learner.tratamientoDatosMenorPath === "__existing__") && old?.tratamiento_datos_menor_path) {
        learner.tratamientoDatosMenorPath = old.tratamiento_datos_menor_path;
        learner.tratamientoDatosMenorNombre = old.tratamiento_datos_menor_nombre ?? "";
        learner.tratamientoDatosMenorTipo = old.tratamiento_datos_menor_tipo ?? "";
        learner.tratamientoDatosMenorSize = old.tratamiento_datos_menor_size ?? 0;
      }
      if (learner.esMenorEdad) {
        if (!learner.tratamientoDatosMenorPath) return NextResponse.json({ error: "La autorización PDF es obligatoria para aprendices menores de edad." }, { status: 400 });
        const validation = validateMinorConsentMetadata({ fileName: learner.tratamientoDatosMenorNombre ?? "", contentType: learner.tratamientoDatosMenorTipo ?? "", fileSize: learner.tratamientoDatosMenorSize ?? 0 });
        if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }
    if (values.poster_proyecto_path) {
      const validation = validatePosterMetadata({ fileName: values.poster_proyecto_nombre ?? "", contentType: values.poster_proyecto_tipo ?? "", fileSize: values.poster_proyecto_size ?? 0 });
      if (!validation.valid) return NextResponse.json({ error: validation.error || "El póster no tiene una ruta válida." }, { status: 400 });
    }

    const db = createSupabaseServerClient();
    const now = new Date().toISOString();
    const projectUpdate: Record<string, unknown> = {
      nombre_proyecto: values.titulo, linea_tematica: values.area_conocimiento, linea_tematica_otro: values.linea_tematica_otro?.trim() || null,
      semillero: values.semillero, semillero_otro: values.semillero_otro?.trim() || null, institucion: values.institucion, municipio: values.municipio,
      resumen_problema: values.resumen_problema, resumen_objetivo: values.resumen_objetivo, resumen_metodologia: values.resumen_metodologia,
      resumen_resultados: values.resumen_resultados, resumen_conclusiones: values.resumen_conclusiones, modalidades_proyecto: values.modalidades_proyecto,
      modalidad_otro: values.modalidad_otro?.trim() || null, modalidad_participacion: values.modalidad_participacion?.trim() || null,
      estado_desarrollo_proyecto: values.estado_desarrollo_proyecto, productos_obtenidos: values.productos_obtenidos,
      productos_obtenidos_otro: values.productos_obtenidos_otro?.trim() || null, nivel_madurez: values.nivel_madurez,
      requiere_conexion_electrica: values.requiere_conexion_electrica, requiere_mesa_mobiliario: values.requiere_mesa_mobiliario,
      presenta_prototipo_funcional: values.presenta_prototipo_funcional, requiere_otro_elemento: values.requiere_otro_elemento,
      otro_elemento_descripcion: values.requiere_otro_elemento ? values.otro_elemento_descripcion?.trim() || null : null,
      actualizado_por_documento: values.documento_solicitante.trim(), actualizado_at: now, estado_analisis_ia: "Pendiente", ...legacy(values.integrantes),
    };
    if (values.poster_proyecto_path) Object.assign(projectUpdate, {
      poster_proyecto_path: values.poster_proyecto_path, poster_proyecto_nombre: values.poster_proyecto_nombre,
      poster_proyecto_tipo: values.poster_proyecto_tipo, poster_proyecto_size: values.poster_proyecto_size,
      poster_actualizado_at: now, poster_actualizado_por_documento: values.documento_solicitante.trim(),
    });
    const { error: updateError } = await db.from("proyectos").update(projectUpdate).eq("id", project.id);
    if (updateError) { logStep("actualización de proyecto", updateError, project.id); throw new RegistrationUpdateError("No fue posible actualizar los datos del proyecto.", "actualización de proyecto"); }

    const rows = [
      { proyecto_id: project.id, rol_integrante: "Autor principal", nombre_completo: values.integrantes.autorPrincipal.nombreCompleto, documento: values.integrantes.autorPrincipal.documento ?? "", correo: values.integrantes.autorPrincipal.correo, celular: values.integrantes.autorPrincipal.celular, ficha: "", orden: 1 },
      ...values.integrantes.aprendices.map((item, index) => ({ proyecto_id: project.id, rol_integrante: "Aprendiz participante", nombre_completo: item.nombreCompleto, documento: item.documento, correo: item.correo, celular: item.celular, ficha: item.ficha?.trim() || "", es_menor_edad: Boolean(item.esMenorEdad), tratamiento_datos_menor_path: item.esMenorEdad ? item.tratamientoDatosMenorPath : null, tratamiento_datos_menor_nombre: item.esMenorEdad ? item.tratamientoDatosMenorNombre : null, tratamiento_datos_menor_tipo: item.esMenorEdad ? item.tratamientoDatosMenorTipo : null, tratamiento_datos_menor_size: item.esMenorEdad ? item.tratamientoDatosMenorSize : null, orden: index + 1 })),
      ...values.integrantes.instructoresInvestigadores.map((item, index) => ({ proyecto_id: project.id, rol_integrante: item.rol, nombre_completo: item.nombreCompleto, documento: item.documento, correo: item.correo, celular: item.celular, ficha: "", es_menor_edad: false, orden: index + 1 })),
    ];
    const { error: deleteError } = await db.from("proyecto_integrantes").delete().eq("proyecto_id", project.id);
    if (deleteError) { logStep("actualización de integrantes", deleteError, project.id); throw new RegistrationUpdateError("No fue posible reemplazar los integrantes del proyecto.", "actualización de integrantes"); }
    const { error: insertError } = await db.from("proyecto_integrantes").insert(rows);
    if (insertError) { logStep("actualización de integrantes", insertError, project.id); throw new RegistrationUpdateError("No fue posible guardar los integrantes del proyecto.", "actualización de integrantes"); }

    const { documento_solicitante: _requesterDocument, ...snapshotNew } = values;
    const { error: historyError } = await db.from("proyecto_ediciones").insert({ proyecto_id: project.id, codigo_proyecto: values.codigo_proyecto, documento_solicitante: values.documento_solicitante.trim(), tipo_edicion: "Actualización de inscripción", datos_anteriores: { proyecto: project, integrantes: previousMembers }, datos_nuevos: snapshotNew, observacion: values.observacion?.trim() || null });
    if (historyError) { logStep("historial de edición", historyError, project.id); throw new RegistrationUpdateError("El proyecto se actualizó, pero no fue posible guardar el historial de edición.", "historial de edición"); }
    return NextResponse.json({ ok: true, codigo_proyecto: values.codigo_proyecto });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Error update-registration:", { step: "validación de acceso", issues: error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })) });
      return NextResponse.json({ error: error.issues[0]?.message || "Revise los campos obligatorios del formulario." }, { status: 400 });
    }
    if (error instanceof RegistrationUpdateError) return NextResponse.json({ error: error.message }, { status: error.status });
    logStep("validación de acceso", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar la inscripción." }, { status: 500 });
  }
}
