import crypto from "node:crypto";

import { createCertificatePdf } from "@/lib/certificates/pdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uploadCertificatePdf } from "@/lib/supabase/storage";

export type CertificateType = "Ponente" | "Instructor" | "Evaluador";

interface ProjectRow {
  id: string;
  codigo_proyecto: string;
  nombre_proyecto: string;
  linea_tematica: string;
  modalidad_participacion?: string | null;
  semillero?: string | null;
  institucion?: string | null;
  municipio?: string | null;
  instructor_nombre?: string | null;
  instructor_documento?: string | null;
  instructor_2_nombre?: string | null;
  instructor_2_documento?: string | null;
  instructor_3_nombre?: string | null;
  instructor_3_documento?: string | null;
  aprendiz_1_nombre?: string | null;
  aprendiz_1_documento?: string | null;
  aprendiz_2_nombre?: string | null;
  aprendiz_2_documento?: string | null;
  aprendiz_3_nombre?: string | null;
  aprendiz_3_documento?: string | null;
  categoria_presentacion?: string | null;
}

interface EvaluatorRow {
  id: string;
  codigo_evaluador: string;
  nombre_evaluador: string;
  documento_evaluador?: string | null;
  institucion_evaluador?: string | null;
  area_conocimiento: string;
}

interface ProjectMemberRow {
  id: string;
  proyecto_id: string;
  rol_integrante: "Autor principal" | "Aprendiz participante" | "Instructor" | "Investigador asociado";
  nombre_completo: string;
  documento?: string | null;
  orden: number;
}

interface CertificateCandidate {
  tipo_certificado: CertificateType;
  nombre_persona: string;
  documento_persona: string;
  rol_certificado: string;
  proyecto_id: string | null;
  evaluador_id: string | null;
  proyecto?: ProjectRow;
  evaluador?: EvaluatorRow;
}

interface ExistingCertificate {
  tipo_certificado: CertificateType;
  nombre_persona: string;
  documento_persona: string;
  proyecto_id: string | null;
  evaluador_id: string | null;
}

function certificateKey(row: ExistingCertificate | CertificateCandidate) {
  const personKey = row.documento_persona.trim()
    ? row.documento_persona.trim().toLowerCase()
    : row.nombre_persona.trim().toLowerCase();
  return [
    row.tipo_certificado,
    personKey,
    row.proyecto_id ?? "",
  ].join("|");
}

function safePathPart(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function projectLearners(project: ProjectRow) {
  return [
    {
      nombre: project.aprendiz_1_nombre,
      documento: project.aprendiz_1_documento,
    },
    {
      nombre: project.aprendiz_2_nombre,
      documento: project.aprendiz_2_documento,
    },
    {
      nombre: project.aprendiz_3_nombre,
      documento: project.aprendiz_3_documento,
    },
  ].filter((learner) => learner.nombre?.trim());
}

function projectInstructors(project: ProjectRow) {
  return [
    {
      nombre: project.instructor_nombre,
      documento: project.instructor_documento,
    },
    {
      nombre: project.instructor_2_nombre,
      documento: project.instructor_2_documento,
    },
    {
      nombre: project.instructor_3_nombre,
      documento: project.instructor_3_documento,
    },
  ].filter((instructor) => instructor.nombre?.trim());
}

async function getProjectCandidates(tipoCertificado: CertificateType) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("proyectos")
    .select(
      [
        "id",
        "codigo_proyecto",
        "nombre_proyecto",
        "linea_tematica",
        "modalidad_participacion",
        "semillero",
        "institucion",
        "municipio",
        "instructor_nombre",
        "instructor_documento",
        "instructor_2_nombre",
        "instructor_2_documento",
        "instructor_3_nombre",
        "instructor_3_documento",
        "aprendiz_1_nombre",
        "aprendiz_1_documento",
        "aprendiz_2_nombre",
        "aprendiz_2_documento",
        "aprendiz_3_nombre",
        "aprendiz_3_documento",
        "categoria_presentacion",
      ].join(","),
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[certificates/generate] error Supabase consultando proyectos", error);
    throw error;
  }

  const projects = (data ?? []) as unknown as ProjectRow[];
  const projectIds = projects.map((project) => project.id).filter(Boolean);
  const { data: memberRows, error: membersError } = projectIds.length > 0
    ? await supabase
        .from("proyecto_integrantes")
        .select("id,proyecto_id,rol_integrante,nombre_completo,documento,orden")
        .in("proyecto_id", projectIds)
        .order("orden", { ascending: true })
    : { data: [], error: null };

  if (membersError) {
    console.error("[certificates/generate] error Supabase consultando integrantes", membersError);
    throw membersError;
  }

  const membersByProjectId = new Map<string, ProjectMemberRow[]>();
  ((memberRows ?? []) as unknown as ProjectMemberRow[]).forEach((member) => {
    const current = membersByProjectId.get(member.proyecto_id) ?? [];
    current.push(member);
    membersByProjectId.set(member.proyecto_id, current);
  });

  if (tipoCertificado === "Instructor") {
    return projects.flatMap((project) =>
      (
        membersByProjectId.has(project.id)
          ? (membersByProjectId.get(project.id) ?? [])
              .filter((member) => member.rol_integrante === "Instructor")
              .map((member) => ({ nombre: member.nombre_completo, documento: member.documento }))
          : projectInstructors(project)
      ).map((instructor) => ({
        tipo_certificado: tipoCertificado,
        nombre_persona: String(instructor.nombre),
        documento_persona: String(instructor.documento ?? ""),
        rol_certificado: "Instructor líder",
        proyecto_id: project.id,
        evaluador_id: null,
        proyecto: project,
      })),
    );
  }

  return projects.flatMap((project) =>
    (
      membersByProjectId.has(project.id)
        ? (membersByProjectId.get(project.id) ?? [])
            .filter((member) => member.rol_integrante === "Autor principal" || member.rol_integrante === "Aprendiz participante")
            .map((member) => ({ nombre: member.nombre_completo, documento: member.documento, rol: member.rol_integrante }))
        : projectLearners(project).map((learner) => ({ ...learner, rol: "Aprendiz participante" }))
    ).map((learner) => ({
      tipo_certificado: tipoCertificado,
      nombre_persona: String(learner.nombre),
      documento_persona: String(learner.documento ?? ""),
      rol_certificado: learner.rol === "Autor principal" ? "Autor principal" : "Ponente",
      proyecto_id: project.id,
      evaluador_id: null,
      proyecto: project,
    })),
  );
}

async function getEvaluatorCandidates() {
  const supabase = createSupabaseServerClient();
  const { data: evaluations, error: evaluationsError } = await supabase
    .from("evaluaciones")
    .select("evaluador_id")
    .not("evaluador_id", "is", null);

  if (evaluationsError) {
    console.error("[certificates/generate] error Supabase consultando evaluaciones", evaluationsError);
    throw evaluationsError;
  }

  const evaluatorIds = [
    ...new Set(
      ((evaluations ?? []) as unknown as { evaluador_id: string | null }[])
        .map((evaluation) => evaluation.evaluador_id)
        .filter(Boolean),
    ),
  ] as string[];

  if (evaluatorIds.length === 0) {
    return [];
  }

  const { data: evaluators, error: evaluatorsError } = await supabase
    .from("evaluadores")
    .select(
      "id,codigo_evaluador,nombre_evaluador,documento_evaluador,institucion_evaluador,area_conocimiento",
    )
    .in("id", evaluatorIds);

  if (evaluatorsError) {
    console.error("[certificates/generate] error Supabase consultando evaluadores", evaluatorsError);
    throw evaluatorsError;
  }

  return ((evaluators ?? []) as unknown as EvaluatorRow[]).map((evaluator) => ({
    tipo_certificado: "Evaluador" as const,
    nombre_persona: evaluator.nombre_evaluador,
    documento_persona: String(evaluator.documento_evaluador ?? ""),
    rol_certificado: "Evaluador",
    proyecto_id: null,
    evaluador_id: evaluator.id,
    evaluador: evaluator,
  }));
}

async function getCandidates(tipoCertificado: CertificateType) {
  if (tipoCertificado === "Evaluador") {
    return getEvaluatorCandidates();
  }

  return getProjectCandidates(tipoCertificado);
}

export async function generateCertificates(tipoCertificado: CertificateType) {
  const supabase = createSupabaseServerClient();
  console.log("[certificates/generate] tipo solicitado", tipoCertificado);

  const candidates = (await getCandidates(tipoCertificado)) as CertificateCandidate[];
  console.log("[certificates/generate] cantidad de certificados candidatos", candidates.length);

  const { data: existingRows, error: existingError } = await supabase
    .from("certificados")
    .select("tipo_certificado,nombre_persona,documento_persona,proyecto_id,evaluador_id")
    .eq("tipo_certificado", tipoCertificado);

  if (existingError) {
    console.error("[certificates/generate] error Supabase consultando duplicados", existingError);
    throw existingError;
  }

  const existingKeys = new Set(
    ((existingRows ?? []) as unknown as ExistingCertificate[]).map((row) => certificateKey(row)),
  );

  let generated = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const key = certificateKey(candidate);
    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    const pdf = createCertificatePdf({
      tipoCertificado: candidate.tipo_certificado,
      nombrePersona: candidate.nombre_persona,
      rolCertificado: candidate.rol_certificado,
      nombreProyecto: candidate.proyecto?.nombre_proyecto,
      lineaTematica: candidate.proyecto?.linea_tematica,
      semillero: candidate.proyecto?.semillero ?? undefined,
      areaConocimiento: candidate.evaluador?.area_conocimiento,
    });

    const baseName = safePathPart(
      `${candidate.tipo_certificado}-${candidate.nombre_persona}-${candidate.documento_persona || crypto.randomUUID()}`,
    );
    const storagePath = `${candidate.tipo_certificado.toLowerCase()}/${baseName}-${Date.now()}.pdf`;

    try {
      await uploadCertificatePdf(storagePath, pdf);
    } catch (error) {
      console.error("[certificates/generate] error Supabase Storage subiendo PDF", error);
      throw error;
    }

    const { error: insertError } = await supabase.from("certificados").insert({
      tipo_certificado: candidate.tipo_certificado,
      nombre_persona: candidate.nombre_persona,
      documento_persona: candidate.documento_persona,
      rol_certificado: candidate.rol_certificado,
      proyecto_id: candidate.proyecto_id,
      evaluador_id: candidate.evaluador_id,
      url_certificado: storagePath,
      estado_certificado: "Generado",
    });

    if (insertError) {
      console.error("[certificates/generate] error Supabase guardando certificado", insertError);
      throw insertError;
    }

    existingKeys.add(key);
    generated += 1;
  }

  console.log("[certificates/generate] cantidad generada", generated);
  console.log("[certificates/generate] cantidad omitida por duplicado", skipped);

  return {
    tipo_certificado: tipoCertificado,
    candidatos: candidates.length,
    generados: generated,
    omitidos_por_duplicado: skipped,
  };
}
