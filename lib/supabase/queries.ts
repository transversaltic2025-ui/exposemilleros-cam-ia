import crypto from "node:crypto";

import { LINEAS_TEMATICAS } from "@/lib/constants";
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

function normalizeProject(row: Record<string, unknown>): Project {
  const aprendizNombres = [
    toStringValue(row.aprendiz_1_nombre),
    toStringValue(row.aprendiz_2_nombre),
    toStringValue(row.aprendiz_3_nombre),
  ].filter(Boolean);
  const codigo = toStringValue(row.codigo_proyecto);
  const nombre = toStringValue(row.nombre_proyecto);
  const linea = toStringValue(row.linea_tematica) as Project["linea_tematica"];
  const createdAt = toStringValue(row.created_at) || new Date().toISOString();

  return {
    ...(row as Omit<Project, "codigo" | "fecha_registro" | "titulo" | "area_conocimiento" | "participantes" | "integrantes" | "estado" | "archivo_nombre" | "archivo_storage_path" | "archivo_url" | "evaluadores_asignados">),
    codigo_proyecto: codigo,
    id: toStringValue(row.id),
    nombre_proyecto: nombre,
    linea_tematica: linea,
    modalidad_participacion: toStringValue(row.modalidad_participacion) as Project["modalidad_participacion"],
    semillero: toStringValue(row.semillero) as Project["semillero"],
    institucion: toStringValue(row.institucion),
    municipio: toStringValue(row.municipio),
    instructor_nombre: toStringValue(row.instructor_nombre),
    instructor_documento: toStringValue(row.instructor_documento),
    instructor_correo: toStringValue(row.instructor_correo),
    instructor_celular: toStringValue(row.instructor_celular),
    categoria_presentacion: toStringValue(row.categoria_presentacion) as Project["categoria_presentacion"],
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
    linea_investigacion: linea,
    participantes: aprendizNombres.map((nombreParticipante, index) => ({
      nombre: nombreParticipante,
      documento: toStringValue(row[`aprendiz_${index + 1}_documento`]),
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
      proyecto,
      evaluaciones: evaluacionesMock.filter((item) => item.proyecto_id === codigo),
      analisis: analisisIAMock.find((item) => item.proyecto_id === codigo) ?? null,
    };
  }

  const proyectoId = proyecto.id;
  if (!proyectoId) {
    return { proyecto, evaluaciones: [], analisis: null };
  }

  const client = supabase();
  const [evaluacionesResult, analisisResult] = await Promise.all([
    client.from("evaluaciones").select("*").eq("proyecto_id", proyectoId),
    client.from("analisis_ia").select("*").eq("proyecto_id", proyectoId).maybeSingle(),
  ]);

  if (evaluacionesResult.error) {
    throw evaluacionesResult.error;
  }
  if (analisisResult.error) {
    throw analisisResult.error;
  }

  return {
    proyecto,
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
  modalidad_participacion: string;
  semillero: string;
  institucion: string;
  municipio: string;
  instructor_nombre: string;
  instructor_documento?: string;
  instructor_correo: string;
  instructor_celular: string;
  rol_proyecto?: string;
  aprendiz_1_nombre?: string;
  aprendiz_1_documento?: string;
  aprendiz_1_correo?: string;
  aprendiz_1_celular?: string;
  aprendiz_2_nombre?: string;
  aprendiz_2_documento?: string;
  aprendiz_2_correo?: string;
  aprendiz_2_celular?: string;
  aprendiz_3_nombre?: string;
  aprendiz_3_documento?: string;
  aprendiz_3_correo?: string;
  aprendiz_3_celular?: string;
  categoria_presentacion: string;
  archivo_proyecto_url?: string;
  archivo_proyecto_path?: string;
  archivo_proyecto_nombre?: string;
  archivo_proyecto_tipo?: string;
  archivo_proyecto_size?: number;
  requiere_conexion_electrica?: boolean;
  requiere_mesa_mobiliario?: boolean;
  presenta_prototipo_funcional?: boolean;
  observaciones_adicionales?: string;
  observaciones_admin?: string;
}) {
  const project = {
    codigo_proyecto: input.codigo_proyecto,
    nombre_proyecto: input.nombre_proyecto,
    linea_tematica: input.linea_tematica,
    modalidad_participacion: input.modalidad_participacion,
    semillero: input.semillero,
    institucion: input.institucion,
    municipio: input.municipio,
    instructor_nombre: input.instructor_nombre,
    instructor_documento: input.instructor_documento ?? "",
    instructor_correo: input.instructor_correo,
    instructor_celular: input.instructor_celular,
    rol_proyecto: input.rol_proyecto ?? "",
    aprendiz_1_nombre: input.aprendiz_1_nombre ?? "",
    aprendiz_1_documento: input.aprendiz_1_documento ?? "",
    aprendiz_1_correo: input.aprendiz_1_correo ?? "",
    aprendiz_1_celular: input.aprendiz_1_celular ?? "",
    aprendiz_2_nombre: input.aprendiz_2_nombre ?? "",
    aprendiz_2_documento: input.aprendiz_2_documento ?? "",
    aprendiz_2_correo: input.aprendiz_2_correo ?? "",
    aprendiz_2_celular: input.aprendiz_2_celular ?? "",
    aprendiz_3_nombre: input.aprendiz_3_nombre ?? "",
    aprendiz_3_documento: input.aprendiz_3_documento ?? "",
    aprendiz_3_correo: input.aprendiz_3_correo ?? "",
    aprendiz_3_celular: input.aprendiz_3_celular ?? "",
    categoria_presentacion: input.categoria_presentacion,
    archivo_proyecto_url: input.archivo_proyecto_url ?? "",
    archivo_proyecto_path: input.archivo_proyecto_path ?? "",
    archivo_proyecto_nombre: input.archivo_proyecto_nombre ?? "",
    archivo_proyecto_tipo: input.archivo_proyecto_tipo ?? "",
    archivo_proyecto_size: input.archivo_proyecto_size ?? 0,
    requiere_conexion_electrica: input.requiere_conexion_electrica ?? false,
    requiere_mesa_mobiliario: input.requiere_mesa_mobiliario ?? false,
    presenta_prototipo_funcional: input.presenta_prototipo_funcional ?? false,
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

export async function createEvaluatorAndAssignments(input: {
  nombre_evaluador: string;
  documento_evaluador: string;
  correo_evaluador: string;
  celular_evaluador: string;
  institucion_evaluador: string;
  area_conocimiento: string;
}) {
  const codigoEvaluador = await generateEvaluatorCode();
  const evaluador = {
    codigo_evaluador: codigoEvaluador,
    nombre_evaluador: input.nombre_evaluador,
    documento_evaluador: input.documento_evaluador,
    correo_evaluador: input.correo_evaluador,
    celular_evaluador: input.celular_evaluador,
    institucion_evaluador: input.institucion_evaluador,
    area_conocimiento: input.area_conocimiento,
    estado_evaluador: "Activo",
    cantidad_proyectos_asignados: 0,
  };

  console.log("[evaluators/register] payload del evaluador", evaluador);

  const client = supabase();
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
  const assignments = await assignProjectsToEvaluator(created);

  return { evaluador: created, assignments };
}

export async function assignProjectsToEvaluator(evaluador: Evaluator) {
  if (!evaluador.id) {
    throw new Error("Evaluator id missing after insert.");
  }

  const client = supabase();
  const { data: projectRows, error: projectsError } = await client
    .from("proyectos")
    .select("id,codigo_proyecto,nombre_proyecto,linea_tematica,estado_proyecto,created_at")
    .eq("linea_tematica", evaluador.area_conocimiento)
    .order("created_at", { ascending: true });

  if (projectsError) {
    console.error("[evaluators/register] error exacto de Supabase al buscar proyectos candidatos", projectsError);
    throw projectsError;
  }

  const proyectos = ((projectRows ?? []) as Record<string, unknown>[]).map(normalizeProject);
  console.log("[evaluators/register] proyectos candidatos encontrados", proyectos.length);

  const projectIds = proyectos.map((proyecto) => proyecto.id).filter(Boolean) as string[];
  if (projectIds.length === 0) {
    console.log("[evaluators/register] asignaciones creadas", []);
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

  const proyectosDisponibles = proyectos
    .filter((proyecto) => {
      if (!proyecto.id) {
        return false;
      }
      return (
        (asignacionesPorProyecto.get(proyecto.id) ?? 0) < 2 &&
        !proyectosYaAsignadosAlEvaluador.has(proyecto.id)
      );
    })
    .slice(0, 3);

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

  const { error: evaluatorUpdateError } = await client
    .from("evaluadores")
    .update({
      cantidad_proyectos_asignados: rows.length,
    })
    .eq("id", evaluador.id);

  if (evaluatorUpdateError) {
    console.error("[evaluators/register] error exacto de Supabase al actualizar evaluador", evaluatorUpdateError);
    throw evaluatorUpdateError;
  }

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
    recomendacion_final: "Destacado" | "Aprobar" | "Ajustar" | "No recomendado";
    concepto_evaluador: string;
    detalles?: EvaluationDetailInput[];
  },
) {
  console.log("[evaluations] token recibido", token);
  const { asignacion, proyecto, criterios } = await getEvaluationByToken(token);
  if (!asignacion) {
    throw new Error("Assignment token not found.");
  }
  console.log("[evaluations] asignacion encontrada", asignacion);
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
    recomendacion_final: input.recomendacion_final,
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
    client.from("proyectos").select("id").order("created_at", { ascending: false }),
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

  const conteosPorProyecto = ((projectsResult.data ?? []) as { id: string }[]).map(
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
