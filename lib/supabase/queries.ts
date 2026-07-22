import crypto from "node:crypto";

import { LINEAS_TEMATICAS } from "@/lib/constants";
import { isEvaluatorAssignmentOpen } from "@/lib/event-config";
import {
  analisisIAMock,
  asignacionesMock,
  certificadosMock,
  criteriosEvaluacionMock,
  evaluadoresMock,
  evaluacionesMock,
  getEvaluacionByToken as getMockEvaluacionByToken,
  getProyectoByCodigo as getMockProyectoByCodigo,
  logisticaMock,
  proyectosMock,
  resumenLogisticaMock,
  tendenciasPorAreaMock,
} from "@/lib/mock-data";
import type {
  AIAnalysis,
  Assignment,
  CertificateRecord,
  EvaluationDetailInput,
  EvaluationCriterion,
  Evaluator,
  HumanEvaluation,
  LogisticsSummary,
  Project,
  ProjectMember,
  ProjectTeamPayload,
  TrendByArea,
} from "@/types";
import { createSupabaseServerClient } from "./server";

export function shouldUseMockData() {
  return process.env.USE_MOCK_DATA !== "false";
}

function supabase() {
  return createSupabaseServerClient();
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toDisplayText(value: unknown) {
  const text = toStringValue(value).trim();
  return text || "Pendiente";
}

function toNumberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeEmail(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toLowerCase();
}

export function normalizeDocument(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().replace(/[\s.,-]+/g, "");
}

function normalizeArea(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

type InstructorProjectFields = Pick<
  Project,
  | "instructor_documento"
  | "instructor_correo"
  | "instructor_2_documento"
  | "instructor_2_correo"
  | "instructor_3_documento"
  | "instructor_3_correo"
>;

export function isEvaluatorInstructorOfProject(
  evaluador: Pick<Evaluator, "documento_evaluador" | "correo_evaluador">,
  proyecto: InstructorProjectFields,
) {
  const evaluatorDocument = normalizeDocument(evaluador.documento_evaluador);
  const evaluatorEmail = normalizeEmail(evaluador.correo_evaluador);

  const instructorDocuments = [
    proyecto.instructor_documento,
    proyecto.instructor_2_documento,
    proyecto.instructor_3_documento,
  ].map(normalizeDocument);
  const instructorEmails = [
    proyecto.instructor_correo,
    proyecto.instructor_2_correo,
    proyecto.instructor_3_correo,
  ].map(normalizeEmail);

  return (
    Boolean(evaluatorDocument && instructorDocuments.some((document) => document === evaluatorDocument)) ||
    Boolean(evaluatorEmail && instructorEmails.some((email) => email === evaluatorEmail))
  );
}

function normalizeProjectMember(row: Record<string, unknown>): ProjectMember {
  return {
    id: toStringValue(row.id),
    proyecto_id: toStringValue(row.proyecto_id),
    rol_integrante: toStringValue(row.rol_integrante) as ProjectMember["rol_integrante"],
    nombre_completo: toStringValue(row.nombre_completo),
    documento: toStringValue(row.documento),
    correo: toStringValue(row.correo),
    celular: toStringValue(row.celular),
    ficha: toStringValue(row.ficha),
    es_menor_edad: Boolean(row.es_menor_edad),
    tratamiento_datos_menor_path: toStringValue(row.tratamiento_datos_menor_path),
    tratamiento_datos_menor_nombre: toStringValue(row.tratamiento_datos_menor_nombre),
    tratamiento_datos_menor_tipo: toStringValue(row.tratamiento_datos_menor_tipo),
    tratamiento_datos_menor_size: toNumberValue(row.tratamiento_datos_menor_size),
    orden: toNumberValue(row.orden),
    created_at: toStringValue(row.created_at),
  };
}

function legacyProjectMembers(project: Project): ProjectMember[] {
  const aprendices = ([1, 2, 3] as const)
    .map((index) => ({
      rol_integrante: "Aprendiz participante" as const,
      nombre_completo: project[`aprendiz_${index}_nombre`] ?? "",
      documento: project[`aprendiz_${index}_documento`] ?? "",
      correo: project[`aprendiz_${index}_correo`] ?? "",
      celular: project[`aprendiz_${index}_celular`] ?? "",
      ficha: project[`aprendiz_${index}_ficha`] ?? "",
      es_menor_edad: false,
      tratamiento_datos_menor_path: "",
      tratamiento_datos_menor_nombre: "",
      tratamiento_datos_menor_tipo: "",
      tratamiento_datos_menor_size: 0,
      orden: index,
    }))
    .filter((member) => member.nombre_completo.trim());

  const instructores = ([1, 2, 3] as const)
    .map((index) => {
      const prefix = index === 1 ? "instructor" : `instructor_${index}`;
      return {
        rol_integrante: "Instructor" as const,
        nombre_completo: String(project[`${prefix}_nombre` as keyof Project] ?? ""),
        documento: String(project[`${prefix}_documento` as keyof Project] ?? ""),
        correo: String(project[`${prefix}_correo` as keyof Project] ?? ""),
      celular: String(project[`${prefix}_celular` as keyof Project] ?? ""),
      es_menor_edad: false,
      tratamiento_datos_menor_path: "",
      tratamiento_datos_menor_nombre: "",
      tratamiento_datos_menor_tipo: "",
      tratamiento_datos_menor_size: 0,
      orden: index,
      };
    })
    .filter((member) => member.nombre_completo.trim());

  return [...aprendices, ...instructores];
}

export async function getProjectMembers(projectId: string) {
  if (!projectId || shouldUseMockData()) {
    return [];
  }

  const { data, error } = await supabase()
    .from("proyecto_integrantes")
    .select("*")
    .eq("proyecto_id", projectId)
    .order("rol_integrante", { ascending: true })
    .order("orden", { ascending: true });

  if (error) {
    console.error("[projects/members] error exacto consultando integrantes", error);
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map(normalizeProjectMember);
}

export async function createProjectMembers(projectId: string, team: ProjectTeamPayload) {
  const autoresPrincipales = team.autoresPrincipales?.length ? team.autoresPrincipales : [team.autorPrincipal];
  const rows = [
    ...autoresPrincipales.map((autor, index) => ({
      proyecto_id: projectId,
      rol_integrante: "Autor principal",
      nombre_completo: autor.nombreCompleto,
      documento: autor.documento ?? "",
      correo: autor.correo,
      celular: autor.celular,
      ficha: "",
      orden: index + 1,
    })),
    ...team.aprendices.map((aprendiz, index) => ({
      proyecto_id: projectId,
      rol_integrante: "Aprendiz participante",
      nombre_completo: aprendiz.nombreCompleto,
      documento: aprendiz.documento,
      correo: aprendiz.correo,
      celular: aprendiz.celular,
      ficha: aprendiz.ficha ?? "",
      es_menor_edad: aprendiz.esMenorEdad ?? false,
      tratamiento_datos_menor_path: aprendiz.esMenorEdad ? aprendiz.tratamientoDatosMenorPath ?? "" : null,
      tratamiento_datos_menor_nombre: aprendiz.esMenorEdad ? aprendiz.tratamientoDatosMenorNombre ?? "" : null,
      tratamiento_datos_menor_tipo: aprendiz.esMenorEdad ? aprendiz.tratamientoDatosMenorTipo ?? "" : null,
      tratamiento_datos_menor_size: aprendiz.esMenorEdad ? aprendiz.tratamientoDatosMenorSize ?? 0 : null,
      orden: index + 1,
    })),
    ...team.instructoresInvestigadores.map((member, index) => ({
      proyecto_id: projectId,
      rol_integrante: member.rol,
      nombre_completo: member.nombreCompleto,
      documento: member.documento,
      correo: member.correo,
      celular: member.celular,
      ficha: "",
      es_menor_edad: false,
      tratamiento_datos_menor_path: null,
      tratamiento_datos_menor_nombre: null,
      tratamiento_datos_menor_tipo: null,
      tratamiento_datos_menor_size: null,
      orden: index + 1,
    })),
  ];

  const { data, error } = await supabase()
    .from("proyecto_integrantes")
    .insert(rows)
    .select("*");

  if (error) {
    console.error("[projects/register] error exacto insertando integrantes", error);
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map(normalizeProjectMember);
}

function isEvaluatorProjectMember(
  evaluador: Pick<Evaluator, "documento_evaluador" | "correo_evaluador">,
  proyecto: Project,
  members: ProjectMember[],
) {
  const evaluatorDocument = normalizeDocument(evaluador.documento_evaluador);
  const evaluatorEmail = normalizeEmail(evaluador.correo_evaluador);
  const candidates = members.length > 0 ? members : legacyProjectMembers(proyecto);

  return candidates.some((member) => {
    const memberDocument = normalizeDocument(member.documento);
    const memberEmail = normalizeEmail(member.correo);
    return (
      Boolean(evaluatorDocument && memberDocument && evaluatorDocument === memberDocument) ||
      Boolean(evaluatorEmail && memberEmail && evaluatorEmail === memberEmail)
    );
  });
}

function normalizeProject(row: Record<string, unknown>): Project {
  const aprendizNombres = [
    toStringValue(row.aprendiz_1_nombre),
    toStringValue(row.aprendiz_2_nombre),
    toStringValue(row.aprendiz_3_nombre),
  ].filter(Boolean);
  const codigo = toStringValue(row.codigo_proyecto);
  const nombre = toStringValue(row.nombre_proyecto);
  const linea = toStringValue(row.linea_tematica) as Project["linea_tematica"];
  const lineaInvestigacion = toStringValue(row.linea_investigacion);
  const createdAt = toStringValue(row.created_at) || new Date().toISOString();

  return {
    ...(row as Omit<Project, "codigo" | "fecha_registro" | "titulo" | "area_conocimiento" | "participantes" | "integrantes" | "estado" | "archivo_nombre" | "archivo_storage_path" | "archivo_url" | "evaluadores_asignados">),
    codigo_proyecto: codigo,
    id: toStringValue(row.id),
    nombre_proyecto: nombre,
    linea_tematica: linea,
    modalidad_participacion: toStringValue(row.modalidad_participacion) as Project["modalidad_participacion"],
    semillero: toStringValue(row.semillero) as Project["semillero"],
    semillero_otro: toStringValue(row.semillero_otro),
    institucion: toStringValue(row.institucion),
    municipio: toStringValue(row.municipio),
    linea_tematica_otro: toStringValue(row.linea_tematica_otro),
    resumen_problema: toStringValue(row.resumen_problema),
    resumen_objetivo: toStringValue(row.resumen_objetivo),
    resumen_metodologia: toStringValue(row.resumen_metodologia),
    resumen_resultados: toStringValue(row.resumen_resultados),
    resumen_conclusiones: toStringValue(row.resumen_conclusiones),
    modalidades_proyecto: toStringArray(row.modalidades_proyecto),
    modalidad_otro: toStringValue(row.modalidad_otro),
    estado_desarrollo_proyecto: toStringValue(row.estado_desarrollo_proyecto),
    productos_obtenidos: toStringArray(row.productos_obtenidos),
    productos_obtenidos_otro: toStringValue(row.productos_obtenidos_otro),
    nivel_madurez: toStringValue(row.nivel_madurez),
    instructor_nombre: toStringValue(row.instructor_nombre),
    instructor_documento: toStringValue(row.instructor_documento),
    instructor_correo: toStringValue(row.instructor_correo),
    instructor_celular: toStringValue(row.instructor_celular),
    instructor_2_nombre: toStringValue(row.instructor_2_nombre),
    instructor_2_documento: toStringValue(row.instructor_2_documento),
    instructor_2_correo: toStringValue(row.instructor_2_correo),
    instructor_2_celular: toStringValue(row.instructor_2_celular),
    instructor_3_nombre: toStringValue(row.instructor_3_nombre),
    instructor_3_documento: toStringValue(row.instructor_3_documento),
    instructor_3_correo: toStringValue(row.instructor_3_correo),
    instructor_3_celular: toStringValue(row.instructor_3_celular),
    aprendiz_1_ficha: toStringValue(row.aprendiz_1_ficha),
    aprendiz_2_ficha: toStringValue(row.aprendiz_2_ficha),
    aprendiz_3_ficha: toStringValue(row.aprendiz_3_ficha),
    categoria_presentacion: toStringValue(row.categoria_presentacion) as Project["categoria_presentacion"],
    requiere_conexion_electrica: Boolean(row.requiere_conexion_electrica),
    requiere_mesa_mobiliario: Boolean(row.requiere_mesa_mobiliario),
    presenta_prototipo_funcional: Boolean(row.presenta_prototipo_funcional),
    requiere_otro_elemento: Boolean(row.requiere_otro_elemento),
    otro_elemento_descripcion: toStringValue(row.otro_elemento_descripcion),
    poster_proyecto_path: toStringValue(row.poster_proyecto_path),
    poster_proyecto_nombre: toStringValue(row.poster_proyecto_nombre),
    poster_proyecto_tipo: toStringValue(row.poster_proyecto_tipo),
    poster_proyecto_size: toNumberValue(row.poster_proyecto_size),
    estado_proyecto: toStringValue(row.estado_proyecto) as Project["estado_proyecto"],
    estado_evaluacion_humana: toStringValue(row.estado_evaluacion_humana) as Project["estado_evaluacion_humana"],
    estado_analisis_ia: toStringValue(row.estado_analisis_ia) as Project["estado_analisis_ia"],
    estado_lectura_archivo: toStringValue(row.estado_lectura_archivo) as Project["estado_lectura_archivo"],
    created_at: createdAt,
    codigo,
    fecha_registro: createdAt,
    titulo: nombre,
    resumen: toStringValue(row.observaciones_adicionales),
    area_conocimiento: linea,
    linea_investigacion: lineaInvestigacion || linea,
    participantes: aprendizNombres.map((nombreParticipante, index) => ({
      nombre: nombreParticipante,
      documento: toStringValue(row[`aprendiz_${index + 1}_documento`]),
      ficha: toStringValue(row[`aprendiz_${index + 1}_ficha`]),
    })),
    integrantes: aprendizNombres,
    estado: toStringValue(row.estado_proyecto) as Project["estado"],
    archivo_nombre: toStringValue(row.archivo_proyecto_nombre),
    archivo_storage_path: toStringValue(row.archivo_proyecto_path),
    archivo_url: toStringValue(row.archivo_proyecto_url),
    evaluadores_asignados: 0,
    requiere_certificado: true,
  };
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function normalizeAIAnalysis(row: Record<string, unknown>): AIAnalysis {
  return {
    ...(row as unknown as AIAnalysis),
    proyecto_id: toStringValue(row.proyecto_id),
    resumen_ia: toStringValue(row.resumen_ia),
    tendencias_identificadas: toStringArray(row.tendencias_identificadas),
    palabras_clave_ia: toStringArray(row.palabras_clave_ia),
    sectores_relacionados: toStringArray(row.sectores_relacionados),
    riesgos_detectados: toStringArray(row.riesgos_detectados),
    oportunidades_detectadas: toStringArray(row.oportunidades_detectadas),
    enfoque_genero_ia: toDisplayText(row.enfoque_genero_ia),
    nivel_inclusion_genero_ia: toNumberValue(row.nivel_inclusion_genero_ia),
    recomendaciones_genero_ia: toStringArray(row.recomendaciones_genero_ia),
    enfoque_etnico_ia: toDisplayText(row.enfoque_etnico_ia),
    nivel_inclusion_etnica_ia: toNumberValue(row.nivel_inclusion_etnica_ia),
    recomendaciones_etnicas_ia: toStringArray(row.recomendaciones_etnicas_ia),
    enfoque_diferencial_ia: toDisplayText(row.enfoque_diferencial_ia),
    riesgos_exclusion_ia: toStringArray(row.riesgos_exclusion_ia),
    oportunidades_inclusion_ia: toStringArray(row.oportunidades_inclusion_ia),
    alertas_calidad: toStringArray(row.alertas_calidad),
    concepto_ia: toStringValue(row.concepto_ia),
    nivel_tendencia_ia:
      toStringValue(row.nivel_tendencia_ia) as AIAnalysis["nivel_tendencia_ia"],
  };
}

async function selectAll<T>(table: string, order?: { column: string; ascending?: boolean }) {
  let query = supabase().from(table).select("*");
  if (order) {
    query = query.order(order.column, { ascending: order.ascending ?? true });
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []) as T[];
}

export async function getProjects() {
  if (shouldUseMockData()) {
    return proyectosMock;
  }

  const rows = await selectAll<Record<string, unknown>>("proyectos", {
    column: "created_at",
    ascending: false,
  });
  return rows.map(normalizeProject);
}

export async function getProjectByCodigo(codigo: string) {
  if (shouldUseMockData()) {
    return getMockProyectoByCodigo(codigo) ?? null;
  }

  const { data, error } = await supabase()
    .from("proyectos")
    .select("*")
    .eq("codigo_proyecto", codigo)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeProject(data as Record<string, unknown>) : null;
}

export async function getProjectEditHistory(projectId: string) {
  if (!projectId || shouldUseMockData()) return [];
  const { data, error } = await supabase()
    .from("proyecto_ediciones")
    .select("id, created_at, documento_solicitante, tipo_edicion, observacion")
    .eq("proyecto_id", projectId)
    .order("created_at", { ascending: false });
  if (error) {
    // Permite desplegar la UI antes de ejecutar la migración sin romper el detalle actual.
    console.error("[projects/edit-history]", error);
    return [];
  }
  return (data ?? []) as Array<{ id: string; created_at: string; documento_solicitante: string; tipo_edicion: string; observacion: string | null }>;
}

export async function getEvaluators() {
  if (shouldUseMockData()) {
    return evaluadoresMock;
  }

  return selectAll<Evaluator>("evaluadores", { column: "created_at", ascending: false });
}

export async function getAssignments() {
  if (shouldUseMockData()) {
    return asignacionesMock;
  }

  const client = supabase();
  const { data: assignmentRows, error } = await client
    .from("asignaciones")
    .select("*")
    .order("fecha_asignacion", { ascending: false });

  if (error) {
    throw error;
  }

  const assignments = (assignmentRows ?? []) as Assignment[];
  const projectIds = [...new Set(assignments.map((item) => item.proyecto_id).filter(Boolean))];
  const evaluatorIds = [...new Set(assignments.map((item) => item.evaluador_id).filter(Boolean))];

  const [projectsResult, evaluatorsResult] = await Promise.all([
    projectIds.length > 0
      ? client
          .from("proyectos")
          .select("id,codigo_proyecto,nombre_proyecto,linea_tematica")
          .in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    evaluatorIds.length > 0
      ? client
          .from("evaluadores")
          .select("id,codigo_evaluador,nombre_evaluador")
          .in("id", evaluatorIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (projectsResult.error) {
    throw projectsResult.error;
  }
  if (evaluatorsResult.error) {
    throw evaluatorsResult.error;
  }

  const projectsById = new Map(
    ((projectsResult.data ?? []) as Record<string, unknown>[]).map((project) => [
      String(project.id),
      project,
    ]),
  );
  const evaluatorsById = new Map(
    ((evaluatorsResult.data ?? []) as Record<string, unknown>[]).map((evaluator) => [
      String(evaluator.id),
      evaluator,
    ]),
  );

  return assignments.map((assignment) => {
    const project = assignment.proyecto_id ? projectsById.get(assignment.proyecto_id) : undefined;
    const evaluator = evaluatorsById.get(assignment.evaluador_id);
    return {
      ...assignment,
      proyecto_codigo: project ? toStringValue(project.codigo_proyecto) : assignment.proyecto_id,
      proyecto_nombre: project ? toStringValue(project.nombre_proyecto) : "",
      proyecto_area: project
        ? (toStringValue(project.linea_tematica) as Assignment["proyecto_area"])
        : undefined,
      evaluador_codigo: evaluator ? toStringValue(evaluator.codigo_evaluador) : assignment.evaluador_id,
      evaluador_nombre: evaluator ? toStringValue(evaluator.nombre_evaluador) : assignment.evaluador_id,
    };
  });
}

export async function getAssignmentsForEvaluator(evaluatorId: string) {
  if (!evaluatorId) {
    return [];
  }
  if (shouldUseMockData()) {
    return asignacionesMock.filter((assignment) => assignment.evaluador_id === evaluatorId);
  }

  const client = supabase();
  const { data: assignmentRows, error } = await client
    .from("asignaciones")
    .select("*")
    .eq("evaluador_id", evaluatorId)
    .order("fecha_asignacion", { ascending: false });

  if (error) {
    console.error("[evaluators/assignments] error exacto consultando asignaciones del evaluador", error);
    throw error;
  }

  const assignments = (assignmentRows ?? []) as Assignment[];
  const projectIds = [...new Set(assignments.map((item) => item.proyecto_id).filter(Boolean))];
  const { data: projectRows, error: projectsError } = projectIds.length > 0
    ? await client
        .from("proyectos")
        .select("id,codigo_proyecto,nombre_proyecto,linea_tematica")
        .in("id", projectIds)
    : { data: [], error: null };

  if (projectsError) {
    console.error("[evaluators/assignments] error exacto consultando proyectos asignados", projectsError);
    throw projectsError;
  }

  const projectsById = new Map(
    ((projectRows ?? []) as Record<string, unknown>[]).map((project) => [
      String(project.id),
      project,
    ]),
  );

  return assignments.map((assignment) => {
    const project = assignment.proyecto_id ? projectsById.get(assignment.proyecto_id) : undefined;
    return {
      ...assignment,
      proyecto_codigo: project ? toStringValue(project.codigo_proyecto) : assignment.proyecto_id,
      proyecto_nombre: project ? toStringValue(project.nombre_proyecto) : "",
      proyecto_area: project
        ? (toStringValue(project.linea_tematica) as Assignment["proyecto_area"])
        : undefined,
    };
  });
}

async function updateEvaluatorAssignmentCount(evaluador: Evaluator, count: number) {
  if (!evaluador.id) {
    return evaluador;
  }

  const { data, error } = await supabase()
    .from("evaluadores")
    .update({ cantidad_proyectos_asignados: count })
    .eq("id", evaluador.id)
    .select("*")
    .single();

  if (error) {
    console.error("[evaluators/register] error exacto actualizando cantidad_proyectos_asignados", error);
    throw error;
  }

  return data as Evaluator;
}

export async function getEvaluatorAssignmentsByAccessToken(token: string) {
  if (shouldUseMockData()) {
    const evaluator = evaluadoresMock[0];
    const assignments = evaluator ? asignacionesMock.filter((assignment) => assignment.evaluador_id === evaluator.evaluador_id) : [];
    return {
      evaluator: evaluator ? { ...evaluator, token_acceso: token } : null,
      assignments,
      evaluations: evaluacionesMock.filter((evaluation) => assignments.some((assignment) => assignment.asignacion_id === evaluation.asignacion_id)),
      assignmentOpen: isEvaluatorAssignmentOpen(),
    };
  }

  const client = supabase();
  const { data: evaluatorRow, error } = await client
    .from("evaluadores")
    .select("*")
    .eq("token_acceso", token)
    .maybeSingle();

  if (error) {
    console.error("[evaluators/assignments] error exacto buscando evaluador por token", error);
    throw error;
  }

  if (!evaluatorRow) {
    return { evaluator: null, assignments: [] };
  }

  const evaluator = evaluatorRow as Evaluator;
  const { error: updateError } = await client
    .from("evaluadores")
    .update({ fecha_ultimo_acceso: new Date().toISOString() })
    .eq("id", evaluator.id);

  if (updateError) {
    console.error("[evaluators/assignments] error exacto actualizando fecha_ultimo_acceso", updateError);
    throw updateError;
  }

  const currentAssignments = await getAssignmentsForEvaluator(evaluator.id ?? "");
  const assignmentOpen = isEvaluatorAssignmentOpen();
  if (assignmentOpen && currentAssignments.length < 3) {
    await assignProjectsToEvaluator(evaluator);
  }
  const assignments = assignmentOpen
    ? await getAssignmentsForEvaluator(evaluator.id ?? "")
    : currentAssignments;

  return {
    evaluator,
    assignments,
    evaluations: await getEvaluationsForEvaluator(evaluator.id ?? ""),
    assignmentOpen,
  };
}

async function getEvaluationsForEvaluator(evaluatorId: string) {
  if (!evaluatorId) {
    return [];
  }

  const client = supabase();
  const { data, error } = await client
    .from("evaluaciones")
    .select("*")
    .eq("evaluador_id", evaluatorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[evaluators/assignments] error exacto consultando evaluaciones del evaluador", error);
    throw error;
  }

  const evaluations = (data ?? []) as HumanEvaluation[];
  const projectIds = [...new Set(evaluations.map((evaluation) => evaluation.proyecto_id).filter(Boolean))];
  const { data: projects, error: projectsError } = projectIds.length > 0
    ? await client
        .from("proyectos")
        .select("id,codigo_proyecto,nombre_proyecto,linea_tematica")
        .in("id", projectIds)
    : { data: [], error: null };

  if (projectsError) {
    console.error("[evaluators/assignments] error exacto consultando proyectos evaluados", projectsError);
    throw projectsError;
  }

  const projectsById = new Map(
    ((projects ?? []) as Record<string, unknown>[]).map((project) => [
      String(project.id),
      project,
    ]),
  );

  return evaluations.map((evaluation) => {
    const project = projectsById.get(evaluation.proyecto_id);
    return {
      ...evaluation,
      proyecto_codigo: project ? toStringValue(project.codigo_proyecto) : evaluation.proyecto_id,
      proyecto_nombre: project ? toStringValue(project.nombre_proyecto) : "Proyecto evaluado",
      proyecto_area: project ? toStringValue(project.linea_tematica) : "",
    };
  });
}

export async function getEvaluationCriteria() {
  if (shouldUseMockData()) {
    return criteriosEvaluacionMock;
  }

  const { data, error } = await supabase()
    .from("criterios")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as EvaluationCriterion[];
}

export async function getHumanEvaluations() {
  if (shouldUseMockData()) {
    return evaluacionesMock;
  }

  return selectAll<HumanEvaluation>("evaluaciones", { column: "created_at", ascending: false });
}

export async function getAIAnalyses() {
  if (shouldUseMockData()) {
    return analisisIAMock;
  }

  const rows = await selectAll<Record<string, unknown>>("analisis_ia", {
    column: "created_at",
    ascending: false,
  });
  return rows.map(normalizeAIAnalysis);
}

export async function getCertificates() {
  if (shouldUseMockData()) {
    return certificadosMock;
  }

  const client = supabase();
  const { data: certificateRows, error } = await client
    .from("certificados")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const certificates = (certificateRows ?? []) as CertificateRecord[];
  const projectIds = [
    ...new Set(certificates.map((certificate) => certificate.proyecto_id).filter(Boolean)),
  ] as string[];

  if (projectIds.length === 0) {
    return certificates;
  }

  const { data: projectRows, error: projectsError } = await client
    .from("proyectos")
    .select("id,codigo_proyecto,nombre_proyecto")
    .in("id", projectIds);

  if (projectsError) {
    throw projectsError;
  }

  const projectsById = new Map(
    ((projectRows ?? []) as Record<string, unknown>[]).map((project) => [
      toStringValue(project.id),
      project,
    ]),
  );

  return certificates.map((certificate) => {
    const project = certificate.proyecto_id
      ? projectsById.get(certificate.proyecto_id)
      : undefined;
    return {
      ...certificate,
      proyecto_codigo: project ? toStringValue(project.codigo_proyecto) : undefined,
      proyecto_nombre: project ? toStringValue(project.nombre_proyecto) : undefined,
    };
  });
}

export async function getProjectDetail(codigo: string) {
  const proyecto = await getProjectByCodigo(codigo);
  if (!proyecto) {
    return { proyecto: null, evaluaciones: [], analisis: null };
  }

  if (shouldUseMockData()) {
    return {
      proyecto: { ...proyecto, equipo: legacyProjectMembers(proyecto) },
      evaluaciones: evaluacionesMock.filter((item) => item.proyecto_id === codigo),
      analisis: analisisIAMock.find((item) => item.proyecto_id === codigo) ?? null,
    };
  }

  const proyectoId = proyecto.id;
  if (!proyectoId) {
    return { proyecto: { ...proyecto, equipo: legacyProjectMembers(proyecto) }, evaluaciones: [], analisis: null };
  }

  const client = supabase();
  const [evaluacionesResult, analisisResult, members] = await Promise.all([
    client.from("evaluaciones").select("*").eq("proyecto_id", proyectoId),
    client.from("analisis_ia").select("*").eq("proyecto_id", proyectoId).maybeSingle(),
    getProjectMembers(proyectoId),
  ]);

  if (evaluacionesResult.error) {
    throw evaluacionesResult.error;
  }
  if (analisisResult.error) {
    throw analisisResult.error;
  }

  return {
    proyecto: {
      ...proyecto,
      equipo: members.length > 0 ? members : legacyProjectMembers(proyecto),
    },
    evaluaciones: (evaluacionesResult.data ?? []) as HumanEvaluation[],
    analisis: analisisResult.data
      ? normalizeAIAnalysis(analisisResult.data as Record<string, unknown>)
      : null,
  };
}

export async function getEvaluationByToken(token: string) {
  if (shouldUseMockData()) {
    const result = getMockEvaluacionByToken(token);
    return {
      asignacion: result.asignacion ?? null,
      proyecto: result.proyecto ?? null,
      evaluador: null,
      criterios: criteriosEvaluacionMock,
      analisis: result.analisis ?? null,
    };
  }

  const client = supabase();
  const { data: asignacion, error: assignmentError } = await client
    .from("asignaciones")
    .select("*")
    .eq("token_evaluacion", token)
    .maybeSingle();

  if (assignmentError) {
    throw assignmentError;
  }
  if (!asignacion) {
    return { asignacion: null, proyecto: null, evaluador: null, criterios: [], analisis: null };
  }

  const assignment = asignacion as Assignment;
  const proyectoId = assignment.proyecto_id;
  if (!proyectoId) {
    return { asignacion: assignment, proyecto: null, evaluador: null, criterios: [], analisis: null };
  }

  const [proyectoResult, evaluadorResult, criteriosResult] = await Promise.all([
    client.from("proyectos").select("*").eq("id", proyectoId).maybeSingle(),
    assignment.evaluador_id
      ? client.from("evaluadores").select("*").eq("id", assignment.evaluador_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    client.from("criterios").select("*").eq("activo", true).order("orden", { ascending: true }),
  ]);

  if (proyectoResult.error) {
    throw proyectoResult.error;
  }
  if (evaluadorResult.error) {
    throw evaluadorResult.error;
  }
  if (criteriosResult.error) {
    throw criteriosResult.error;
  }

  const proyecto = proyectoResult.data
    ? normalizeProject(proyectoResult.data as Record<string, unknown>)
    : null;
  const analisisResult = proyecto?.id
    ? await client.from("analisis_ia").select("*").eq("proyecto_id", proyecto.id).maybeSingle()
    : { data: null, error: null };

  if (analisisResult.error) {
    throw analisisResult.error;
  }

  return {
    asignacion: assignment,
    proyecto,
    evaluador: evaluadorResult.data as Evaluator | null,
    criterios: (criteriosResult.data ?? []) as EvaluationCriterion[],
    analisis: analisisResult.data
      ? normalizeAIAnalysis(analisisResult.data as Record<string, unknown>)
      : null,
  };
}

function getNivelTendencia(porcentaje: number) {
  if (porcentaje <= 39) {
    return "Bajo nivel de tendencia";
  }
  if (porcentaje <= 59) {
    return "Tendencia emergente debil";
  }
  if (porcentaje <= 79) {
    return "Tendencia emergente relevante";
  }
  if (porcentaje <= 89) {
    return "Tendencia fuerte";
  }
  return "Proyecto altamente tendencial";
}

export async function createProject(input: {
  codigo_proyecto: string;
  nombre_proyecto: string;
  linea_tematica: string;
  linea_investigacion?: string;
  modalidad_participacion: string;
  semillero: string;
  semillero_otro?: string;
  institucion: string;
  municipio: string;
  linea_tematica_otro?: string;
  resumen_problema?: string;
  resumen_objetivo?: string;
  resumen_metodologia?: string;
  resumen_resultados?: string;
  resumen_conclusiones?: string;
  modalidades_proyecto?: string[];
  modalidad_otro?: string;
  estado_desarrollo_proyecto?: string;
  productos_obtenidos?: string[];
  productos_obtenidos_otro?: string;
  nivel_madurez?: string;
  instructor_nombre?: string;
  instructor_documento?: string;
  instructor_correo?: string;
  instructor_celular?: string;
  instructor_2_nombre?: string;
  instructor_2_documento?: string;
  instructor_2_correo?: string;
  instructor_2_celular?: string;
  instructor_3_nombre?: string;
  instructor_3_documento?: string;
  instructor_3_correo?: string;
  instructor_3_celular?: string;
  rol_proyecto?: string;
  aprendiz_1_nombre?: string;
  aprendiz_1_documento?: string;
  aprendiz_1_correo?: string;
  aprendiz_1_celular?: string;
  aprendiz_1_ficha?: string;
  aprendiz_2_nombre?: string;
  aprendiz_2_documento?: string;
  aprendiz_2_correo?: string;
  aprendiz_2_celular?: string;
  aprendiz_2_ficha?: string;
  aprendiz_3_nombre?: string;
  aprendiz_3_documento?: string;
  aprendiz_3_correo?: string;
  aprendiz_3_celular?: string;
  aprendiz_3_ficha?: string;
  categoria_presentacion: string;
  archivo_proyecto_url?: string;
  archivo_proyecto_path?: string;
  archivo_proyecto_nombre?: string;
  archivo_proyecto_tipo?: string;
  archivo_proyecto_size?: number;
  poster_proyecto_path?: string;
  poster_proyecto_nombre?: string;
  poster_proyecto_tipo?: string;
  poster_proyecto_size?: number;
  requiere_conexion_electrica?: boolean;
  requiere_mesa_mobiliario?: boolean;
  presenta_prototipo_funcional?: boolean;
  requiere_otro_elemento?: boolean;
  otro_elemento_descripcion?: string;
  observaciones_adicionales?: string;
  observaciones_admin?: string;
}) {
  const project = {
    codigo_proyecto: input.codigo_proyecto,
    nombre_proyecto: input.nombre_proyecto,
    linea_tematica: input.linea_tematica,
    linea_investigacion: input.linea_investigacion ?? "",
    modalidad_participacion: input.modalidad_participacion,
    semillero: input.semillero,
    semillero_otro: input.semillero_otro ?? "",
    institucion: input.institucion,
    municipio: input.municipio,
    linea_tematica_otro: input.linea_tematica_otro ?? "",
    resumen_problema: input.resumen_problema ?? "",
    resumen_objetivo: input.resumen_objetivo ?? "",
    resumen_metodologia: input.resumen_metodologia ?? "",
    resumen_resultados: input.resumen_resultados ?? "",
    resumen_conclusiones: input.resumen_conclusiones ?? "",
    modalidades_proyecto: input.modalidades_proyecto ?? [],
    modalidad_otro: input.modalidad_otro ?? "",
    estado_desarrollo_proyecto: input.estado_desarrollo_proyecto ?? "",
    productos_obtenidos: input.productos_obtenidos ?? [],
    productos_obtenidos_otro: input.productos_obtenidos_otro ?? "",
    nivel_madurez: input.nivel_madurez ?? "",
    instructor_nombre: input.instructor_nombre ?? "",
    instructor_documento: input.instructor_documento ?? "",
    instructor_correo: input.instructor_correo ?? "",
    instructor_celular: input.instructor_celular ?? "",
    instructor_2_nombre: input.instructor_2_nombre ?? "",
    instructor_2_documento: input.instructor_2_documento ?? "",
    instructor_2_correo: input.instructor_2_correo ?? "",
    instructor_2_celular: input.instructor_2_celular ?? "",
    instructor_3_nombre: input.instructor_3_nombre ?? "",
    instructor_3_documento: input.instructor_3_documento ?? "",
    instructor_3_correo: input.instructor_3_correo ?? "",
    instructor_3_celular: input.instructor_3_celular ?? "",
    rol_proyecto: input.rol_proyecto ?? "",
    aprendiz_1_nombre: input.aprendiz_1_nombre ?? "",
    aprendiz_1_documento: input.aprendiz_1_documento ?? "",
    aprendiz_1_correo: input.aprendiz_1_correo ?? "",
    aprendiz_1_celular: input.aprendiz_1_celular ?? "",
    aprendiz_1_ficha: input.aprendiz_1_ficha ?? "",
    aprendiz_2_nombre: input.aprendiz_2_nombre ?? "",
    aprendiz_2_documento: input.aprendiz_2_documento ?? "",
    aprendiz_2_correo: input.aprendiz_2_correo ?? "",
    aprendiz_2_celular: input.aprendiz_2_celular ?? "",
    aprendiz_2_ficha: input.aprendiz_2_ficha ?? "",
    aprendiz_3_nombre: input.aprendiz_3_nombre ?? "",
    aprendiz_3_documento: input.aprendiz_3_documento ?? "",
    aprendiz_3_correo: input.aprendiz_3_correo ?? "",
    aprendiz_3_celular: input.aprendiz_3_celular ?? "",
    aprendiz_3_ficha: input.aprendiz_3_ficha ?? "",
    categoria_presentacion: input.categoria_presentacion,
    archivo_proyecto_url: input.archivo_proyecto_url ?? "",
    archivo_proyecto_path: input.archivo_proyecto_path ?? "",
    archivo_proyecto_nombre: input.archivo_proyecto_nombre ?? "",
    archivo_proyecto_tipo: input.archivo_proyecto_tipo ?? "",
    archivo_proyecto_size: input.archivo_proyecto_size ?? 0,
    poster_proyecto_path: input.poster_proyecto_path ?? "",
    poster_proyecto_nombre: input.poster_proyecto_nombre ?? "",
    poster_proyecto_tipo: input.poster_proyecto_tipo ?? "",
    poster_proyecto_size: input.poster_proyecto_size ?? 0,
    requiere_conexion_electrica: input.requiere_conexion_electrica ?? false,
    requiere_mesa_mobiliario: input.requiere_mesa_mobiliario ?? false,
    presenta_prototipo_funcional: input.presenta_prototipo_funcional ?? false,
    requiere_otro_elemento: input.requiere_otro_elemento ?? false,
    otro_elemento_descripcion: input.otro_elemento_descripcion ?? "",
    observaciones_adicionales: input.observaciones_adicionales ?? "",
    estado_proyecto: "Registrado",
    estado_evaluacion_humana: "Pendiente",
    estado_analisis_ia: "Pendiente",
    estado_lectura_archivo: "Pendiente",
    observaciones_admin: input.observaciones_admin ?? "",
  };

  console.log("[projects/register] payload que se intenta insertar", project);

  const { data, error } = await supabase()
    .from("proyectos")
    .insert(project)
    .select("*")
    .single();

  if (error) {
    console.error("[projects/register] error exacto de Supabase", error);
    throw error;
  }

  console.log("[projects/register] resultado exitoso", data);
  return normalizeProject(data as Record<string, unknown>);
}

export async function generateProjectCode() {
  const { data, error } = await supabase()
    .from("proyectos")
    .select("codigo_proyecto")
    .ilike("codigo_proyecto", "EXPOCAM-2026-%");

  if (error) {
    throw error;
  }

  const max = (data ?? []).reduce((currentMax, row) => {
    const codigo = String(row.codigo_proyecto ?? "");
    const match = /^EXPOCAM-2026-(\d{4})$/.exec(codigo);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return `EXPOCAM-2026-${String(max + 1).padStart(4, "0")}`;
}

export async function generateEvaluatorCode() {
  const { data, error } = await supabase()
    .from("evaluadores")
    .select("codigo_evaluador")
    .ilike("codigo_evaluador", "EVAL-2026-%");

  if (error) {
    throw error;
  }

  const max = (data ?? []).reduce((currentMax, row) => {
    const codigo = String(row.codigo_evaluador ?? "");
    const match = /^EVAL-2026-(\d{4})$/.exec(codigo);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return `EVAL-2026-${String(max + 1).padStart(4, "0")}`;
}

function generateEvaluatorAccessToken() {
  return crypto.randomBytes(24).toString("hex");
}

function evaluatorAccessUrl(token: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${appUrl}/evaluadores/mis-asignaciones/${token}`;
}

const ASSIGNMENT_PENDING_MESSAGE =
  "Registro recibido correctamente. Los proyectos serán asignados automáticamente a partir del 5 de agosto de 2026 a las 00:00, hora Colombia, según el perfil y área seleccionada.";

const RECOVERY_PENDING_MESSAGE =
  "Su registro está activo. Los proyectos serán asignados a partir del 5 de agosto de 2026 a las 00:00, hora Colombia.";

function isActiveAssignment(assignment: Pick<Assignment, "estado_asignacion" | "estado">) {
  const status = assignment.estado_asignacion ?? assignment.estado ?? "Pendiente";
  return !["Completada", "Cancelada"].includes(status);
}

async function findExistingEvaluator(input: {
  documento_evaluador: string;
  correo_evaluador: string;
}) {
  const client = supabase();
  const normalizedEmail = normalizeEmail(input.correo_evaluador);
  const normalizedDocument = normalizeDocument(input.documento_evaluador);
  const { data, error } = await client
    .from("evaluadores")
    .select("*");

  if (error) {
    console.error("[evaluators/register] error exacto buscando evaluadores existentes", error);
    throw error;
  }

  return ((data ?? []) as Evaluator[]).find((evaluador) => {
    const sameEmail = normalizedEmail && normalizeEmail(evaluador.correo_evaluador) === normalizedEmail;
    const sameDocument = normalizedDocument && normalizeDocument(evaluador.documento_evaluador) === normalizedDocument;
    return sameEmail || sameDocument;
  }) ?? null;
}

async function ensureEvaluatorAccessToken(evaluador: Evaluator) {
  if (!evaluador.id) {
    throw new Error("Evaluator id missing.");
  }
  if (evaluador.token_acceso) {
    return evaluador;
  }

  const token = generateEvaluatorAccessToken();
  console.log("[evaluators/register] token_acceso generado", {
    evaluador_id: evaluador.id,
    codigo_evaluador: evaluador.codigo_evaluador,
  });

  const { data, error } = await supabase()
    .from("evaluadores")
    .update({ token_acceso: token })
    .eq("id", evaluador.id)
    .select("*")
    .single();

  if (error) {
    console.error("[evaluators/register] error exacto actualizando token_acceso", error);
    throw error;
  }

  return data as Evaluator;
}

async function updateExistingEvaluatorProfile(
  evaluador: Evaluator,
  input: {
    nombre_evaluador: string;
    documento_evaluador: string;
    correo_evaluador: string;
    celular_evaluador: string;
    institucion_evaluador: string;
    area_conocimiento: string;
  },
) {
  if (!evaluador.id) {
    return evaluador;
  }

  const { data, error } = await supabase()
    .from("evaluadores")
    .update({
      nombre_evaluador: input.nombre_evaluador,
      documento_evaluador: normalizeDocument(input.documento_evaluador),
      correo_evaluador: normalizeEmail(input.correo_evaluador),
      celular_evaluador: input.celular_evaluador,
      institucion_evaluador: input.institucion_evaluador,
      area_conocimiento: input.area_conocimiento,
      estado_evaluador: "Activo",
    })
    .eq("id", evaluador.id)
    .select("*")
    .single();

  if (error) {
    console.error("[evaluators/register] error exacto actualizando evaluador existente", error);
    throw error;
  }

  return data as Evaluator;
}

export async function recoverEvaluatorAccessByDocument(documentoEvaluador: string) {
  const normalizedDocument = normalizeDocument(documentoEvaluador);
  console.log("[evaluators/recover-access] documento recibido", documentoEvaluador);
  console.log("[evaluators/recover-access] documento normalizado", normalizedDocument);

  if (!normalizedDocument) {
    return {
      success: false,
      error: "No encontramos un evaluador registrado con ese documento.",
    };
  }

  if (shouldUseMockData()) {
    const evaluator = evaluadoresMock
      .filter((item) => normalizeDocument(item.documento_evaluador ?? item.documento) === normalizedDocument)
      .sort((a, b) => String(b.created_at ?? b.fecha_registro ?? "").localeCompare(String(a.created_at ?? a.fecha_registro ?? "")))[0];

    console.log("[evaluators/recover-access] evaluador encontrado", Boolean(evaluator));
    if (!evaluator) {
      return {
        success: false,
        error: "No encontramos un evaluador registrado con ese documento.",
      };
    }

    const token = evaluator.token_acceso ?? "mock-evaluator-token";
    const url = evaluatorAccessUrl(token);
    console.log("[evaluators/recover-access] token_acceso generado", evaluator.token_acceso ? "no" : "si");
    console.log("[evaluators/recover-access] URL de acceso generada", url);

    return {
      success: true,
      evaluator: {
        id: evaluator.id ?? evaluator.evaluador_id,
        codigo_evaluador: evaluator.codigo_evaluador ?? evaluator.evaluador_id,
        nombre_evaluador: evaluator.nombre_evaluador ?? evaluator.nombre,
        documento_evaluador: evaluator.documento_evaluador ?? evaluator.documento,
        area_conocimiento: evaluator.area_conocimiento,
      },
      evaluatorAccessUrl: url,
      assignmentOpen: isEvaluatorAssignmentOpen(),
      message: isEvaluatorAssignmentOpen()
        ? "Acceso encontrado. Puedes continuar con tus proyectos asignados."
        : RECOVERY_PENDING_MESSAGE,
    };
  }

  const client = supabase();
  const { data, error } = await client
    .from("evaluadores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[evaluators/recover-access] error exacto consultando evaluadores", error);
    throw error;
  }

  const evaluator = ((data ?? []) as Evaluator[]).find((item) => {
    return normalizeDocument(item.documento_evaluador) === normalizedDocument;
  });

  console.log("[evaluators/recover-access] evaluador encontrado", Boolean(evaluator));
  if (!evaluator) {
    return {
      success: false,
      error: "No encontramos un evaluador registrado con ese documento.",
    };
  }

  const evaluatorHadToken = Boolean(evaluator.token_acceso);
  const evaluatorWithToken = await ensureEvaluatorAccessToken(evaluator);
  const { error: updateError } = await client
    .from("evaluadores")
    .update({ fecha_ultimo_acceso: new Date().toISOString() })
    .eq("id", evaluatorWithToken.id);

  if (updateError) {
    console.error("[evaluators/recover-access] error exacto actualizando fecha_ultimo_acceso", updateError);
    throw updateError;
  }

  const currentAssignments = await getAssignmentsForEvaluator(evaluatorWithToken.id ?? "");
  const assignmentOpen = isEvaluatorAssignmentOpen();
  const newAssignments = assignmentOpen && currentAssignments.length < 3
    ? await assignProjectsToEvaluator(evaluatorWithToken)
    : [];
  const url = evaluatorAccessUrl(evaluatorWithToken.token_acceso ?? "");
  console.log("[evaluators/recover-access] token_acceso generado", evaluatorHadToken ? "no" : "si");
  console.log("[evaluators/recover-access] URL de acceso generada", url);

  return {
    success: true,
    evaluator: {
      id: evaluatorWithToken.id,
      codigo_evaluador: evaluatorWithToken.codigo_evaluador,
      nombre_evaluador: evaluatorWithToken.nombre_evaluador,
      documento_evaluador: evaluatorWithToken.documento_evaluador,
      area_conocimiento: evaluatorWithToken.area_conocimiento,
    },
    evaluatorAccessUrl: url,
    assignmentOpen,
    newAssignmentsCount: newAssignments.length,
    message: assignmentOpen
      ? "Acceso encontrado. Puedes continuar con tus proyectos asignados."
      : RECOVERY_PENDING_MESSAGE,
  };
}

export async function createEvaluatorAndAssignments(input: {
  nombre_evaluador: string;
  documento_evaluador: string;
  correo_evaluador: string;
  celular_evaluador: string;
  institucion_evaluador: string;
  area_conocimiento: string;
}) {
  const client = supabase();
  const existingEvaluator = await findExistingEvaluator(input);
  console.log("[evaluators/register] evaluador existente encontrado", Boolean(existingEvaluator));

  if (existingEvaluator) {
    console.log("[evaluators/register] evaluador ya existia", {
      id: existingEvaluator.id,
      codigo_evaluador: existingEvaluator.codigo_evaluador,
      correo_normalizado: normalizeEmail(input.correo_evaluador),
      documento_normalizado: normalizeDocument(input.documento_evaluador),
    });

    const updatedEvaluator = await updateExistingEvaluatorProfile(existingEvaluator, input);
    const evaluatorWithToken = await ensureEvaluatorAccessToken(updatedEvaluator);
    const assignmentOpen = isEvaluatorAssignmentOpen();
    const newAssignments = assignmentOpen ? await assignProjectsToEvaluator(evaluatorWithToken) : [];
    const currentAssignments = await getAssignmentsForEvaluator(evaluatorWithToken.id ?? "");
    const finalEvaluator = await updateEvaluatorAssignmentCount(evaluatorWithToken, currentAssignments.length);
    const message = assignmentOpen
      ? newAssignments.length > 0
        ? "Ya estabas registrado. Se actualizaron tus proyectos asignados."
        : "Ya estabas registrado, pero no hay proyectos disponibles para asignarte en este momento."
      : ASSIGNMENT_PENDING_MESSAGE;

    console.log("[evaluators/register] cantidad final de asignaciones", {
      evaluador_id: finalEvaluator.id,
      cantidad_proyectos_asignados: currentAssignments.length,
      nuevas_asignaciones: newAssignments.length,
    });

    return {
      success: true,
      evaluator: finalEvaluator,
      evaluador: finalEvaluator,
      assignments: assignmentOpen ? currentAssignments : [],
      asignaciones: assignmentOpen ? currentAssignments : [],
      assignmentsCount: currentAssignments.length,
      cantidad_proyectos_asignados: currentAssignments.length,
      evaluatorAccessUrl: evaluatorAccessUrl(finalEvaluator.token_acceso ?? ""),
      assignmentOpen,
      message,
      newAssignmentsCount: newAssignments.length,
    };
  }

  const codigoEvaluador = await generateEvaluatorCode();
  const tokenAcceso = generateEvaluatorAccessToken();
  const evaluador = {
    codigo_evaluador: codigoEvaluador,
    nombre_evaluador: input.nombre_evaluador,
    documento_evaluador: normalizeDocument(input.documento_evaluador),
    correo_evaluador: normalizeEmail(input.correo_evaluador),
    celular_evaluador: input.celular_evaluador,
    institucion_evaluador: input.institucion_evaluador,
    area_conocimiento: input.area_conocimiento,
    estado_evaluador: "Activo",
    cantidad_proyectos_asignados: 0,
    token_acceso: tokenAcceso,
  };

  console.log("[evaluators/register] payload del evaluador", evaluador);
  console.log("[evaluators/register] token_acceso generado", {
    codigo_evaluador: codigoEvaluador,
  });

  const { data, error } = await client
    .from("evaluadores")
    .insert(evaluador)
    .select("*")
    .single();

  if (error) {
    console.error("[evaluators/register] error exacto de Supabase al crear evaluador", error);
    throw error;
  }

  const created = data as Evaluator;
  console.log("[evaluators/register] evaluador creado", {
    id: created.id,
    codigo_evaluador: created.codigo_evaluador,
  });
  const assignmentOpen = isEvaluatorAssignmentOpen();
  const newAssignments = assignmentOpen ? await assignProjectsToEvaluator(created) : [];
  const currentAssignments = await getAssignmentsForEvaluator(created.id ?? "");
  const finalEvaluator = await updateEvaluatorAssignmentCount(created, currentAssignments.length);
  const message = newAssignments.length === 0
    ? "Tu registro fue creado, pero no hay proyectos disponibles para tu área en este momento."
    : "Evaluador registrado correctamente. Se asignaron proyectos para evaluación.";

  console.log("[evaluators/register] cantidad final de asignaciones", {
    evaluador_id: finalEvaluator.id,
    cantidad_proyectos_asignados: currentAssignments.length,
    nuevas_asignaciones: newAssignments.length,
  });

  return {
    success: true,
    evaluator: finalEvaluator,
    evaluador: finalEvaluator,
    assignments: assignmentOpen ? currentAssignments : [],
    asignaciones: assignmentOpen ? currentAssignments : [],
    assignmentsCount: currentAssignments.length,
    cantidad_proyectos_asignados: currentAssignments.length,
    evaluatorAccessUrl: evaluatorAccessUrl(finalEvaluator.token_acceso ?? ""),
    assignmentOpen,
    message: assignmentOpen ? message : ASSIGNMENT_PENDING_MESSAGE,
    newAssignmentsCount: newAssignments.length,
  };
}

export async function assignProjectsToEvaluator(evaluador: Evaluator) {
  if (!evaluador.id) {
    throw new Error("Evaluator id missing after insert.");
  }

  const client = supabase();
  const existingEvaluatorAssignments = await getAssignmentsForEvaluator(evaluador.id);
  const currentAssignmentsCount = existingEvaluatorAssignments.length;
  const remainingSlots = Math.max(3 - currentAssignmentsCount, 0);

  console.log("[evaluators/register] asignaciones activas actuales", {
    evaluador_id: evaluador.id,
    activeAssignmentsCount: existingEvaluatorAssignments.filter(isActiveAssignment).length,
    currentAssignmentsCount,
    remainingSlots,
  });

  if (remainingSlots <= 0) {
    console.log("[evaluators/register] evaluador ya tiene cupo maximo", {
      evaluador_id: evaluador.id,
      cantidad_final: currentAssignmentsCount,
    });
    return [];
  }

  const { data: projectRows, error: projectsError } = await client
    .from("proyectos")
    .select("id,codigo_proyecto,nombre_proyecto,linea_tematica,estado_proyecto,instructor_documento,instructor_correo,instructor_2_documento,instructor_2_correo,instructor_3_documento,instructor_3_correo,aprendiz_1_nombre,aprendiz_1_documento,aprendiz_1_correo,aprendiz_1_celular,aprendiz_1_ficha,aprendiz_2_nombre,aprendiz_2_documento,aprendiz_2_correo,aprendiz_2_celular,aprendiz_2_ficha,aprendiz_3_nombre,aprendiz_3_documento,aprendiz_3_correo,aprendiz_3_celular,aprendiz_3_ficha,created_at")
    .order("created_at", { ascending: true });

  if (projectsError) {
    console.error("[evaluators/register] error exacto de Supabase al buscar proyectos candidatos", projectsError);
    throw projectsError;
  }

  const proyectosEncontrados = ((projectRows ?? []) as Project[])
    .filter((proyecto) => proyecto.estado_proyecto !== "Cerrado");
  const evaluatorArea = normalizeArea(evaluador.area_conocimiento);
  const proyectos = proyectosEncontrados.filter((proyecto) => {
    return normalizeArea(proyecto.linea_tematica) === evaluatorArea;
  });
  const evaluadorNormalizado = {
    id: evaluador.id,
    codigo_evaluador: evaluador.codigo_evaluador,
    documento_evaluador: evaluador.documento_evaluador,
    documento_normalizado: normalizeDocument(evaluador.documento_evaluador),
    correo_evaluador: evaluador.correo_evaluador,
    correo_normalizado: normalizeEmail(evaluador.correo_evaluador),
    area_conocimiento: evaluador.area_conocimiento,
    area_normalizada: evaluatorArea,
  };
  console.log("[evaluators/register] evaluador normalizado", evaluadorNormalizado);
  console.log("[evaluators/register] área del evaluador original", evaluador.area_conocimiento);
  console.log("[evaluators/register] área normalizada del evaluador", evaluatorArea);
  console.log("[evaluators/register] proyectos encontrados antes del filtro", proyectosEncontrados.map((proyecto) => ({
    id: proyecto.id,
    codigo_proyecto: proyecto.codigo_proyecto,
    nombre_proyecto: proyecto.nombre_proyecto,
    linea_tematica: proyecto.linea_tematica,
    linea_tematica_normalizada: normalizeArea(proyecto.linea_tematica),
    estado_proyecto: proyecto.estado_proyecto,
  })));
  console.log("[evaluators/register] proyectos candidatos después de filtrar por área", proyectos.map((proyecto) => ({
    id: proyecto.id,
    codigo_proyecto: proyecto.codigo_proyecto,
    nombre_proyecto: proyecto.nombre_proyecto,
    linea_tematica: proyecto.linea_tematica,
    instructor_documento: proyecto.instructor_documento,
    instructor_correo: proyecto.instructor_correo,
    instructor_2_documento: proyecto.instructor_2_documento,
    instructor_2_correo: proyecto.instructor_2_correo,
    instructor_3_documento: proyecto.instructor_3_documento,
    instructor_3_correo: proyecto.instructor_3_correo,
  })));

  const projectIds = proyectos.map((proyecto) => proyecto.id).filter(Boolean) as string[];
  if (projectIds.length === 0) {
    console.log("[evaluators/register] proyectos excluidos por cupo lleno", []);
    console.log("[evaluators/register] proyectos excluidos porque el evaluador es instructor del proyecto", []);
    console.log("[evaluators/register] proyectos excluidos por asignacion duplicada", []);
    console.log("[evaluators/register] proyectos finales asignados", []);
    console.log("[evaluators/register] asignaciones creadas", []);
    const realAssignments = await getAssignmentsForEvaluator(evaluador.id);
    await updateEvaluatorAssignmentCount(evaluador, realAssignments.length);
    console.log("[evaluators/register] total real de asignaciones del evaluador después del proceso", {
      evaluador_id: evaluador.id,
      total_real: realAssignments.length,
    });
    return [];
  }

  const { data: asignacionesExistentes, error: assignmentsError } = await client
    .from("asignaciones")
    .select("proyecto_id,evaluador_id")
    .in("proyecto_id", projectIds);

  if (assignmentsError) {
    console.error("[evaluators/register] error exacto de Supabase al contar asignaciones", assignmentsError);
    throw assignmentsError;
  }

  const { data: memberRows, error: membersError } = await client
    .from("proyecto_integrantes")
    .select("*")
    .in("proyecto_id", projectIds);

  if (membersError) {
    console.error("[evaluators/register] error exacto de Supabase al consultar integrantes para conflicto de interes", membersError);
    throw membersError;
  }

  const membersByProjectId = new Map<string, ProjectMember[]>();
  ((memberRows ?? []) as Record<string, unknown>[]).forEach((row) => {
    const member = normalizeProjectMember(row);
    if (!member.proyecto_id) {
      return;
    }
    const current = membersByProjectId.get(member.proyecto_id) ?? [];
    current.push(member);
    membersByProjectId.set(member.proyecto_id, current);
  });

  const asignacionesPorProyecto = new Map<string, number>();
  const proyectosYaAsignadosAlEvaluador = new Set<string>();
  (asignacionesExistentes ?? []).forEach((asignacion) => {
    const proyectoId = String(asignacion.proyecto_id);
    asignacionesPorProyecto.set(
      proyectoId,
      (asignacionesPorProyecto.get(proyectoId) ?? 0) + 1,
    );
    if (String(asignacion.evaluador_id) === evaluador.id) {
      proyectosYaAsignadosAlEvaluador.add(proyectoId);
    }
  });

  const proyectosConCupo = proyectos.filter((proyecto) => {
    const proyectoId = proyecto.id;
    if (!proyectoId) {
      return false;
    }
    return (asignacionesPorProyecto.get(proyectoId) ?? 0) < 2;
  });
  const proyectosExcluidosPorCupo = proyectos.filter((proyecto) => {
    const proyectoId = proyecto.id;
    if (!proyectoId) {
      return true;
    }
    return (asignacionesPorProyecto.get(proyectoId) ?? 0) >= 2;
  });
  console.log("[evaluators/register] proyectos excluidos por cupo lleno", proyectosExcluidosPorCupo.map((proyecto) => ({
    id: proyecto.id,
    codigo_proyecto: proyecto.codigo_proyecto,
    asignaciones_existentes: proyecto.id ? asignacionesPorProyecto.get(proyecto.id) ?? 0 : 0,
  })));

  const proyectosSinInstructor = proyectosConCupo.filter((proyecto) => {
    return !isEvaluatorProjectMember(evaluador, proyecto, proyecto.id ? membersByProjectId.get(proyecto.id) ?? [] : []);
  });
  const proyectosExcluidosPorInstructor = proyectosConCupo.filter((proyecto) => {
    return isEvaluatorProjectMember(evaluador, proyecto, proyecto.id ? membersByProjectId.get(proyecto.id) ?? [] : []);
  });
  console.log("[evaluators/register] proyectos excluidos porque el evaluador es instructor del proyecto", proyectosExcluidosPorInstructor.map((proyecto) => ({
    id: proyecto.id,
    codigo_proyecto: proyecto.codigo_proyecto,
    evaluador_documento_normalizado: evaluadorNormalizado.documento_normalizado,
    evaluador_correo_normalizado: evaluadorNormalizado.correo_normalizado,
    instructores_documentos_normalizados: [
      normalizeDocument(proyecto.instructor_documento),
      normalizeDocument(proyecto.instructor_2_documento),
      normalizeDocument(proyecto.instructor_3_documento),
    ],
    instructores_correos_normalizados: [
      normalizeEmail(proyecto.instructor_correo),
      normalizeEmail(proyecto.instructor_2_correo),
      normalizeEmail(proyecto.instructor_3_correo),
    ],
  })));

  const proyectosDisponiblesSinDuplicado = proyectosSinInstructor.filter((proyecto) => {
    const proyectoId = proyecto.id;
    if (!proyectoId) {
      return false;
    }
    return !proyectosYaAsignadosAlEvaluador.has(proyectoId);
  });
  const proyectosExcluidosPorDuplicado = proyectosSinInstructor.filter((proyecto) => {
    const proyectoId = proyecto.id;
    if (!proyectoId) {
      return false;
    }
    return proyectosYaAsignadosAlEvaluador.has(proyectoId);
  });
  console.log("[evaluators/register] proyectos excluidos por asignacion duplicada", proyectosExcluidosPorDuplicado.map((proyecto) => ({
    id: proyecto.id,
    codigo_proyecto: proyecto.codigo_proyecto,
    evaluador_id: evaluador.id,
  })));

  const proyectosDisponibles = proyectosDisponiblesSinDuplicado.slice(0, remainingSlots);
  console.log("[evaluators/register] proyectos finales asignados", proyectosDisponibles.map((proyecto) => ({
    id: proyecto.id,
    codigo_proyecto: proyecto.codigo_proyecto,
    nombre_proyecto: proyecto.nombre_proyecto,
  })));

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const rows = proyectosDisponibles.map((proyecto) => {
    const tokenEvaluacion = crypto.randomUUID();
    return {
      token_evaluacion: tokenEvaluacion,
      proyecto_id: proyecto.id,
      evaluador_id: evaluador.id,
      estado_asignacion: "Pendiente",
      fecha_asignacion: new Date().toISOString(),
      permitir_edicion: true,
      url_evaluacion: `${appUrl}/evaluar/${tokenEvaluacion}`,
    };
  });

  if (rows.length === 0) {
    console.log("[evaluators/register] asignaciones creadas", []);
    const realAssignments = await getAssignmentsForEvaluator(evaluador.id);
    await updateEvaluatorAssignmentCount(evaluador, realAssignments.length);
    console.log("[evaluators/register] total real de asignaciones del evaluador después del proceso", {
      evaluador_id: evaluador.id,
      total_real: realAssignments.length,
    });
    return [];
  }

  const { data: assignments, error: insertError } = await client
    .from("asignaciones")
    .insert(rows)
    .select("*");

  if (insertError) {
    console.error("[evaluators/register] error exacto de Supabase al crear asignaciones", insertError);
    throw insertError;
  }

  console.log("[evaluators/register] asignaciones creadas", assignments);

  const assignedProjectIds = rows.map((row) => row.proyecto_id);
  const { error: projectsUpdateError } = await client
    .from("proyectos")
    .update({ estado_proyecto: "Asignado" })
    .in("id", assignedProjectIds);

  if (projectsUpdateError) {
    console.error("[evaluators/register] error exacto de Supabase al actualizar proyectos", projectsUpdateError);
    throw projectsUpdateError;
  }

  const realAssignments = await getAssignmentsForEvaluator(evaluador.id);
  await updateEvaluatorAssignmentCount(evaluador, realAssignments.length);

  console.log("[evaluators/register] total real de asignaciones del evaluador después del proceso", {
    evaluador_id: evaluador.id,
    total_real: realAssignments.length,
  });

  return (assignments ?? []) as Assignment[];
}

export async function saveHumanEvaluation(
  token: string,
  input: {
    archivo_abierto: boolean;
    puntaje_pertinencia?: number;
    puntaje_innovacion?: number;
    puntaje_metodologia?: number;
    puntaje_impacto?: number;
    puntaje_comunicacion?: number;
    observaciones?: string;
    fortalezas: string;
    oportunidades?: string;
    oportunidades_mejora?: string;
    recomendacion_final?: string | null;
    concepto_evaluador: string;
    detalles?: EvaluationDetailInput[];
  },
) {
  console.log("[evaluations] token recibido", token);
  const { asignacion, proyecto, evaluador, criterios } = await getEvaluationByToken(token);
  if (!asignacion) {
    throw new Error("Assignment token not found.");
  }
  console.log("[evaluations] asignacion encontrada", asignacion);
  console.log("[evaluations] evaluador encontrado", evaluador ? {
    id: evaluador.id,
    codigo_evaluador: evaluador.codigo_evaluador,
  } : null);
  console.log("[evaluations] token_acceso del evaluador", evaluador?.token_acceso ? "disponible" : "faltante");
  if ((asignacion.estado_asignacion === "Completada" || asignacion.estado === "Completada") && asignacion.permitir_edicion !== true) {
    throw new Error("Esta evaluación ya fue registrada.");
  }
  if (!proyecto?.id) {
    throw new Error("Project not found for assignment token.");
  }

  const oldScores = [
    input.puntaje_pertinencia,
    input.puntaje_innovacion,
    input.puntaje_metodologia,
    input.puntaje_impacto,
    input.puntaje_comunicacion,
  ].filter((score): score is number => typeof score === "number");
  const details = input.detalles?.length
    ? input.detalles
    : criterios.slice(0, oldScores.length).map((criterio, index) => ({
        criterio_id: criterio.id,
        puntaje: oldScores[index],
        observacion_criterio: input.observaciones ?? "",
      }));
  const puntaje_total = details.length > 0
    ? details.reduce((sum, detail) => sum + detail.puntaje, 0)
    : oldScores.reduce((sum, score) => sum + score, 0);
  const maxTotal = details.length > 0
    ? details.reduce((sum, detail) => {
        const criterio = criterios.find((item) => item.id === detail.criterio_id);
        return sum + (criterio?.puntaje_maximo ?? 20);
      }, 0)
    : oldScores.length * 20;
  const promedio = details.length > 0 || oldScores.length > 0
    ? puntaje_total / Math.max(details.length || oldScores.length, 1)
    : 0;
  const porcentaje = maxTotal > 0 ? Math.round((puntaje_total / maxTotal) * 100) : 0;
  const evaluation = {
    asignacion_id: asignacion.id,
    proyecto_id: proyecto.id,
    evaluador_id: asignacion.evaluador_id,
    concepto_evaluador: input.concepto_evaluador,
    fortalezas: input.fortalezas,
    oportunidades_mejora: input.oportunidades_mejora ?? input.oportunidades ?? "",
    recomendacion_final: input.recomendacion_final ?? "No aplica",
    puntaje_total,
    promedio,
    porcentaje,
    nivel_tendencia: getNivelTendencia(porcentaje),
  };
  console.log("[evaluations] payload de evaluacion antes de insertar", evaluation);

  const client = supabase();
  const { data, error } = await client
    .from("evaluaciones")
    .insert(evaluation)
    .select("*")
    .single();

  if (error) {
    console.error("[evaluations] error exacto de Supabase al insertar evaluacion", error);
    throw error;
  }
  console.log("[evaluations] evaluacion creada correctamente", data);
  console.log("[evaluations] evaluación guardada", {
    evaluacion_id: data.id,
    asignacion_id: asignacion.id,
  });

  if (details.length > 0) {
    const detailRows = details.map((detail) => ({
      evaluacion_id: data.id,
      criterio_id: detail.criterio_id,
      puntaje: detail.puntaje,
      observacion_criterio: detail.observacion_criterio ?? "",
    }));
    const { error: detailsError } = await client
      .from("evaluacion_detalles")
      .insert(detailRows);

    if (detailsError) {
      console.error("[evaluations] error exacto de Supabase al insertar detalles", detailsError);
      throw detailsError;
    }
  }

  const { error: assignmentUpdateError } = await client
    .from("asignaciones")
    .update({
      estado_asignacion: "Completada",
      fecha_envio_evaluacion: new Date().toISOString(),
    })
    .eq("token_evaluacion", token);

  if (assignmentUpdateError) {
    console.error("[evaluations] error exacto de Supabase al actualizar asignacion", assignmentUpdateError);
    throw assignmentUpdateError;
  }
  console.log("[evaluations] asignacion actualizada correctamente", asignacion.id);
  console.log("[evaluations] asignación actualizada", {
    asignacion_id: asignacion.id,
    estado_asignacion: "Completada",
  });

  return data as HumanEvaluation;
}

export async function getLogisticsSummary(): Promise<LogisticsSummary> {
  if (shouldUseMockData()) {
    return resumenLogisticaMock;
  }

  const client = supabase();
  const countRows = async (table: string, label: string, build = client.from(table).select("*", { count: "exact", head: true })) => {
    const { count, error } = await build;
    if (error) {
      console.error(`[admin/dashboard] Error consultando ${label}`, error);
      throw error;
    }
    return count ?? 0;
  };

  const [
    proyectos,
    evaluadores,
    asignaciones,
    evaluaciones,
    certificadosPendientes,
    asignacionesPendientes,
    projectsResult,
    assignmentsResult,
  ] = await Promise.all([
    countRows("proyectos", "total de proyectos"),
    countRows("evaluadores", "total de evaluadores"),
    countRows("asignaciones", "total de asignaciones"),
    countRows("evaluaciones", "total de evaluaciones"),
    countRows(
      "certificados",
      "certificados pendientes",
      client
        .from("certificados")
        .select("*", { count: "exact", head: true })
        .eq("estado_certificado", "Pendiente"),
    ),
    countRows(
      "asignaciones",
      "asignaciones pendientes",
      client
        .from("asignaciones")
        .select("*", { count: "exact", head: true })
        .neq("estado_asignacion", "Completada"),
    ),
    client
      .from("proyectos")
      .select("id,requiere_conexion_electrica,requiere_mesa_mobiliario,presenta_prototipo_funcional,requiere_otro_elemento")
      .order("created_at", { ascending: false }),
    client
      .from("asignaciones")
      .select("proyecto_id")
      .order("fecha_asignacion", { ascending: false }),
  ]);

  if (projectsResult.error) {
    console.error("[admin/dashboard] Error consultando proyectos para conteo por evaluadores", projectsResult.error);
    throw projectsResult.error;
  }
  if (assignmentsResult.error) {
    console.error("[admin/dashboard] Error consultando asignaciones para conteo por proyecto", assignmentsResult.error);
    throw assignmentsResult.error;
  }

  const asignacionesPorProyecto = new Map<string, number>();
  ((assignmentsResult.data ?? []) as { proyecto_id: string | null }[]).forEach((assignment) => {
    if (!assignment.proyecto_id) {
      return;
    }
    asignacionesPorProyecto.set(
      assignment.proyecto_id,
      (asignacionesPorProyecto.get(assignment.proyecto_id) ?? 0) + 1,
    );
  });

  const projectRows = (projectsResult.data ?? []) as {
    id: string;
    requiere_conexion_electrica?: boolean | null;
    requiere_mesa_mobiliario?: boolean | null;
    presenta_prototipo_funcional?: boolean | null;
    requiere_otro_elemento?: boolean | null;
  }[];
  const conteosPorProyecto = projectRows.map(
    (project) => asignacionesPorProyecto.get(project.id) ?? 0,
  );

  return {
    proyectos,
    evaluadores,
    asignaciones,
    evaluaciones,
    certificadosPendientes,
    asignacionesPendientes,
    proyectosSinEvaluador: conteosPorProyecto.filter((count) => count === 0).length,
    proyectosConUnEvaluador: conteosPorProyecto.filter((count) => count === 1).length,
    proyectosConDosEvaluadores: conteosPorProyecto.filter((count) => count >= 2).length,
    proyectosRequierenElectricidad: projectRows.filter((project) => project.requiere_conexion_electrica).length,
    proyectosRequierenMobiliario: projectRows.filter((project) => project.requiere_mesa_mobiliario).length,
    proyectosConPrototipoFuncional: projectRows.filter((project) => project.presenta_prototipo_funcional).length,
    proyectosRequierenOtroElemento: projectRows.filter((project) => project.requiere_otro_elemento).length,
  };
}

export async function getTrendsByArea(): Promise<TrendByArea[]> {
  if (shouldUseMockData()) {
    return tendenciasPorAreaMock;
  }

  const [projects, evaluations, aiAnalyses] = await Promise.all([
    getProjects(),
    getHumanEvaluations(),
    getAIAnalyses(),
  ]);

  return LINEAS_TEMATICAS.map((area) => {
    const areaProjects = projects.filter((project) => project.area_conocimiento === area);
    const projectIds = new Set(areaProjects.map((project) => project.id ?? project.codigo));
    const areaEvaluations = evaluations.filter((evaluation) => projectIds.has(evaluation.proyecto_id));
    const areaAnalyses = aiAnalyses.filter(
      (analysis) =>
        projectIds.has(analysis.proyecto_id) &&
        typeof analysis.puntaje_sugerido_ia === "number",
    );
    const average =
      areaEvaluations.length === 0
        ? 0
        : Math.round(
            areaEvaluations.reduce((sum, evaluation) => sum + evaluation.puntaje_total, 0) /
              areaEvaluations.length,
          );
    const aiAverage =
      areaAnalyses.length === 0
        ? 0
        : Math.round(
            areaAnalyses.reduce((sum, analysis) => sum + (analysis.puntaje_sugerido_ia ?? 0), 0) /
              areaAnalyses.length,
          );

    return {
      area,
      proyectos: areaProjects.length,
      puntajePromedio: average,
      puntajePromedioIA: aiAverage,
      analisisIA: areaAnalyses.length,
    };
  });
}

export async function getPendingAssignmentsCount() {
  if (shouldUseMockData()) {
    return asignacionesMock.filter((item) => item.estado !== "Completada").length;
  }

  const assignments = await getAssignments();
  return assignments.filter((item) => item.estado_asignacion !== "Completada").length;
}

export async function getEventLogistics() {
  return logisticaMock;
}
