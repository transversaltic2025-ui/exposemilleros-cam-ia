import crypto from "node:crypto";

import {
  hasEvaluatorProjectConflict,
  normalizeDocument,
  normalizeEmail,
} from "@/lib/assignment-conflicts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Evaluator, Project, ProjectMember } from "@/types";

const countsForCapacity = (status: unknown) =>
  !["cancelada", "eliminada", "anulada"].includes(String(status ?? "").trim().toLowerCase());

export async function createAdminEvaluator(input: {
  nombre_evaluador: string;
  documento_evaluador: string;
  correo_evaluador: string;
  celular_evaluador: string;
  area_conocimiento: string;
}) {
  const client = createSupabaseServerClient();
  const document = normalizeDocument(input.documento_evaluador);
  const email = normalizeEmail(input.correo_evaluador);
  const [byDocument, byEmail] = await Promise.all([
    client.from("evaluadores").select("*").eq("documento_evaluador", document).limit(1),
    client.from("evaluadores").select("*").ilike("correo_evaluador", email).limit(1),
  ]);
  if (byDocument.error) throw byDocument.error;
  if (byEmail.error) throw byEmail.error;
  const existing = (byDocument.data?.[0] ?? byEmail.data?.[0]) as Evaluator | undefined;
  if (existing) {
    if (existing.token_acceso) return { evaluator: existing, created: false };
    const { data, error } = await client.from("evaluadores")
      .update({ token_acceso: crypto.randomUUID(), estado_evaluador: "Activo" })
      .eq("id", existing.id).select("*").single();
    if (error) throw error;
    return { evaluator: data as Evaluator, created: false };
  }
  const { data, error } = await client.from("evaluadores").insert({
    ...input,
    documento_evaluador: document,
    correo_evaluador: email,
    codigo_evaluador: `EVA-${Date.now().toString(36).toUpperCase()}`,
    estado_evaluador: "Activo",
    cantidad_proyectos_asignados: 0,
    token_acceso: crypto.randomUUID(),
  }).select("*").single();
  if (error) throw error;
  return { evaluator: data as Evaluator, created: true };
}

export async function createManualAssignment({
  projectId,
  projectCode,
  evaluatorId,
}: {
  projectId?: string;
  projectCode?: string;
  evaluatorId: string;
}) {
  const client = createSupabaseServerClient();
  const projectQuery = client.from("proyectos").select("*");
  const resolvedProjectQuery = projectId
    ? projectQuery.eq("id", projectId)
    : projectQuery.eq("codigo_proyecto", projectCode ?? "");
  const [{ data: project, error: projectError }, { data: evaluator, error: evaluatorError }] = await Promise.all([
    resolvedProjectQuery.single(),
    client.from("evaluadores").select("*").eq("id", evaluatorId).single(),
  ]);
  if (projectError || !project) throw new Error("El proyecto no existe.");
  if (evaluatorError || !evaluator) throw new Error("El evaluador no existe.");
  const evaluatorStatus = String(evaluator.estado_evaluador ?? "").trim().toLowerCase();
  if (evaluatorStatus === "inactivo") {
    throw new Error("Este evaluador no está activo.");
  }
  const resolvedProjectId = String(project.id);

  const { data: assignments, error: assignmentError } = await client
    .from("asignaciones").select("id,evaluador_id,estado_asignacion").eq("proyecto_id", resolvedProjectId);
  if (assignmentError) throw assignmentError;
  if ((assignments ?? []).some((item) => item.evaluador_id === evaluatorId)) {
    throw new Error("Este evaluador ya está asignado a este proyecto.");
  }
  const evaluatorAssignmentCount = await countEvaluatorAssignments(evaluatorId);
  if (evaluatorAssignmentCount >= 3) {
    throw new Error("El evaluador ya alcanzó el máximo de 3 proyectos asignados.");
  }
  const typedProject = project as Project;
  const limit = typedProject.requiere_asignacion_manual
    ? Math.min(Math.max(typedProject.cupo_evaluadores_manual ?? 4, 1), 4)
    : 2;
  if ((assignments ?? []).filter((assignment) => countsForCapacity(assignment.estado_asignacion)).length >= limit) {
    throw new Error("Este proyecto ya completó el cupo de evaluadores asignados.");
  }
  const { data: members, error: membersError } = await client
    .from("proyecto_integrantes").select("*").eq("proyecto_id", resolvedProjectId);
  if (membersError) throw membersError;
  if (hasEvaluatorProjectConflict(
    evaluator as Evaluator,
    typedProject,
    (members ?? []) as ProjectMember[],
  ).hasConflict) {
    throw new Error("No se puede asignar este evaluador porque aparece como integrante del proyecto.");
  }

  const token = crypto.randomUUID();
  const { data, error } = await client.from("asignaciones").insert({
    proyecto_id: resolvedProjectId,
    evaluador_id: evaluatorId,
    token_evaluacion: token,
    estado_asignacion: "Pendiente",
    permitir_edicion: true,
    url_evaluacion: `/evaluar/${token}`,
    tipo_asignacion: "Manual",
    asignado_por_admin: true,
    fecha_asignacion: new Date().toISOString(),
  }).select("*").single();
  if (error) throw error;
  await client.from("proyectos").update({ estado_proyecto: "Asignado" }).eq("id", resolvedProjectId);
  await client.from("evaluadores").update({
    cantidad_proyectos_asignados: await countEvaluatorAssignments(evaluatorId),
  }).eq("id", evaluatorId);
  return data;
}

async function countEvaluatorAssignments(evaluatorId: string) {
  const client = createSupabaseServerClient();
  const { data, error } = await client.from("asignaciones")
    .select("estado_asignacion").eq("evaluador_id", evaluatorId);
  if (error) throw error;
  return (data ?? []).filter((assignment) => countsForCapacity(assignment.estado_asignacion)).length;
}

export async function deleteUnevaluatedAssignment(id: string) {
  const client = createSupabaseServerClient();
  const { data: assignment, error } = await client.from("asignaciones")
    .select("id,evaluador_id,estado_asignacion").eq("id", id).single();
  if (error || !assignment) throw new Error("La asignación no existe.");
  const { count, error: evaluationError } = await client.from("evaluaciones")
    .select("id", { count: "exact", head: true }).eq("asignacion_id", id);
  if (evaluationError) throw evaluationError;
  if ((count ?? 0) > 0 || assignment.estado_asignacion === "Completada") {
    throw new Error("No se puede quitar una asignación que ya tiene evaluación registrada.");
  }
  const { error: deleteError } = await client.from("asignaciones").delete().eq("id", id);
  if (deleteError) throw deleteError;
  await client.from("evaluadores").update({
    cantidad_proyectos_asignados: await countEvaluatorAssignments(assignment.evaluador_id),
  }).eq("id", assignment.evaluador_id);
}
