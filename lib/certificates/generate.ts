import crypto from "node:crypto";

import { generateCertificatePdf } from "@/lib/certificates/pdf";
import { getActiveCertificateTemplate, textPositionsFromTemplate } from "@/lib/certificates/templates";
import { cleanCertificateText } from "@/lib/certificates/text";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uploadCertificatePdf } from "@/lib/supabase/storage";
import { certificateTypeToStorageFolder, sanitizeStorageKey } from "@/lib/certificates/storage-key";

export type CertificateType = "Ponente" | "Líder de proyecto" | "Evaluador" | "Evaluador productores campesinos";

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
  rol_integrante: "Autor principal" | "Aprendiz participante" | "Instructor" | "Líder" | "Líder de proyecto" | "Instructor líder" | "Investigador asociado";
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
  id: string;
  tipo_certificado: CertificateType | "Instructor" | "Instructor líder";
  nombre_persona: string;
  documento_persona: string;
  proyecto_id: string | null;
  evaluador_id: string | null;
  url_certificado?: string | null;
}

function certificateKey(row: ExistingCertificate | CertificateCandidate) {
  const cleanDocument = cleanCertificateText(row.documento_persona).toLowerCase();
  const personKey = cleanDocument || cleanCertificateText(row.nombre_persona).toLowerCase();
  const normalizedType = row.tipo_certificado === "Instructor" || row.tipo_certificado === "Instructor líder"
    ? "Líder de proyecto"
    : row.tipo_certificado;
  return [
    normalizedType,
    personKey,
    row.proyecto_id ?? "",
  ].join("|");
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

  if (tipoCertificado === "Líder de proyecto") {
    return projects.flatMap((project) =>
      (
        membersByProjectId.has(project.id)
          ? (membersByProjectId.get(project.id) ?? [])
              .filter((member) => ["Instructor", "Líder", "Líder de proyecto", "Instructor líder"].includes(member.rol_integrante))
              .map((member) => ({ nombre: member.nombre_completo, documento: member.documento }))
          : projectInstructors(project)
      ).map((instructor) => ({
        tipo_certificado: tipoCertificado,
        nombre_persona: String(instructor.nombre),
        documento_persona: String(instructor.documento ?? ""),
        rol_certificado: "Líder de proyecto",
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
      rol_certificado: "Ponente",
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

async function getProducerEvaluatorCandidates() {
  const supabase = createSupabaseServerClient();
  const { data: evaluations, error: evaluationsError } = await supabase
    .from("evaluaciones_productores")
    .select("evaluadora_id")
    .not("evaluadora_id", "is", null);
  if (evaluationsError) throw evaluationsError;

  const ids = [...new Set(((evaluations ?? []) as { evaluadora_id: string }[]).map(item => item.evaluadora_id).filter(Boolean))];
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("evaluadoras_productores")
    .select("id,nombre,documento")
    .in("id", ids);
  if (error) throw error;

  return ((data ?? []) as { id: string; nombre: string; documento: string }[]).map(person => ({
    tipo_certificado: "Evaluador productores campesinos" as const,
    nombre_persona: person.nombre,
    documento_persona: String(person.documento ?? ""),
    rol_certificado: "Evaluador",
    proyecto_id: null,
    evaluador_id: null,
  }));
}

export async function getProducerEvaluatorCertificateCount() {
  return (await getProducerEvaluatorCandidates()).length;
}

async function getCandidates(tipoCertificado: CertificateType) {
  if (tipoCertificado === "Evaluador productores campesinos") {
    return getProducerEvaluatorCandidates();
  }
  if (tipoCertificado === "Evaluador") {
    return getEvaluatorCandidates();
  }

  return getProjectCandidates(tipoCertificado);
}

export async function generateCertificates(tipoCertificado: CertificateType, overwrite = false) {
  const supabase = createSupabaseServerClient();
  console.log("[certificates/generate] tipo solicitado", tipoCertificado);

  const candidates = (await getCandidates(tipoCertificado)) as CertificateCandidate[];
  const activeTemplate = await getActiveCertificateTemplate(tipoCertificado);
  if (!activeTemplate) {
    throw new Error("No hay una plantilla PDF activa.");
  }
  const { data: templateFile, error: templateError } = await supabase.storage
    .from(activeTemplate.bucket)
    .download(activeTemplate.archivo_path);
  if (templateError || !templateFile) {
    throw templateError ?? new Error("No se pudo descargar la plantilla activa.");
  }
  const templateBytes = new Uint8Array(await templateFile.arrayBuffer());
  console.log("[certificates/generate] cantidad de certificados candidatos", candidates.length);

  let existingQuery = supabase
    .from("certificados")
    .select("id,tipo_certificado,nombre_persona,documento_persona,proyecto_id,evaluador_id,url_certificado");
  existingQuery = tipoCertificado === "Líder de proyecto"
    ? existingQuery.in("tipo_certificado", ["Líder de proyecto", "Instructor", "Instructor líder", "Ponente"])
    : existingQuery.eq("tipo_certificado", tipoCertificado);
  const { data: existingRows, error: existingError } = await existingQuery;

  if (existingError) {
    console.error("[certificates/generate] error Supabase consultando duplicados", existingError);
    throw existingError;
  }

  const existingByKey = new Map(
    ((existingRows ?? []) as unknown as ExistingCertificate[]).map((row) => [certificateKey(row), row]),
  );

  let generated = 0;
  let regenerated = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const cleanName = cleanCertificateText(candidate.nombre_persona);
    const cleanDocument = cleanCertificateText(candidate.documento_persona);
    const cleanRole = cleanCertificateText(candidate.rol_certificado);
    if (
      !cleanName ||
      !cleanDocument ||
      !cleanRole
    ) {
      console.warn("No se generó el certificado porque falta nombre, documento o rol.", {
        tipo: candidate.tipo_certificado,
        tiene_nombre: Boolean(cleanName),
        tiene_documento: Boolean(cleanDocument),
        tiene_rol: Boolean(cleanRole),
        proyecto_id: candidate.proyecto_id,
        evaluador_id: candidate.evaluador_id,
      });
      skipped += 1;
      continue;
    }
    const key = certificateKey(candidate);
    let existing = existingByKey.get(key);
    if (!existing && tipoCertificado === "Líder de proyecto") {
      existing = ((existingRows ?? []) as unknown as ExistingCertificate[]).find(row =>
        cleanCertificateText(row.documento_persona).toLowerCase() === cleanDocument.toLowerCase() &&
        (row.proyecto_id ?? "") === (candidate.proyecto_id ?? "") &&
        row.tipo_certificado === "Ponente",
      );
    }
    if (existing && !overwrite) {
      skipped += 1;
      continue;
    }

    const pdf = await generateCertificatePdf({
      tipoCertificado: candidate.tipo_certificado,
      nombrePersona: cleanName,
      documentoPersona: cleanDocument,
      rolCertificado: cleanRole,
    }, {
      templateBytes,
      positions: textPositionsFromTemplate(activeTemplate),
      templateName: `${activeTemplate.nombre} (${activeTemplate.tipo_certificado})`,
    });

    const baseName = sanitizeStorageKey(
      `${candidate.tipo_certificado}-${candidate.nombre_persona}-${candidate.documento_persona || crypto.randomUUID()}`,
    ).slice(0, 160);
    const storageFolder = certificateTypeToStorageFolder(candidate.tipo_certificado);
    const canonicalPrefix = `certificados/${storageFolder}/`;
    const existingPath = existing?.url_certificado &&
      !/^https?:\/\//i.test(existing.url_certificado) &&
      existing.url_certificado.startsWith(canonicalPrefix)
      ? existing.url_certificado
      : null;
    const storagePath = existingPath ?? `${canonicalPrefix}${baseName}-${Date.now()}.pdf`;

    try {
      await uploadCertificatePdf(storagePath, pdf);
    } catch (error) {
      console.error("[certificates/generate] error Supabase Storage subiendo PDF", error);
      throw new Error("No se pudo guardar el certificado porque la ruta del archivo contiene caracteres no permitidos.", { cause: error });
    }

    const certificateData = {
      tipo_certificado: candidate.tipo_certificado,
      nombre_persona: candidate.nombre_persona,
      documento_persona: candidate.documento_persona,
      rol_certificado: candidate.rol_certificado,
      proyecto_id: candidate.proyecto_id,
      evaluador_id: candidate.evaluador_id,
      url_certificado: storagePath,
      estado_certificado: "Generado",
      created_at: new Date().toISOString(),
    };
    const { error: insertError } = existing
      ? await supabase.from("certificados").update(certificateData).eq("id", existing.id)
      : await supabase.from("certificados").insert(certificateData);

    if (insertError) {
      console.error("[certificates/generate] error Supabase guardando certificado", insertError);
      throw insertError;
    }

    existingByKey.set(key, { ...certificateData, id: existing?.id ?? "", url_certificado: storagePath });
    if (existing) regenerated += 1;
    else generated += 1;
  }

  console.log("[certificates/generate] cantidad generada", generated);
  console.log("[certificates/generate] cantidad omitida por duplicado", skipped);

  return {
    tipo_certificado: tipoCertificado,
    candidatos: candidates.length,
    generados: generated,
    regenerados: regenerated,
    omitidos_por_duplicado: skipped,
    message: candidates.length === 0 && tipoCertificado === "Evaluador productores campesinos"
      ? "No hay evaluadores de productores campesinos con evaluaciones registradas."
      : tipoCertificado === "Evaluador productores campesinos"
        ? "Certificados de evaluadores de productores campesinos generados correctamente."
        : undefined,
  };
}
