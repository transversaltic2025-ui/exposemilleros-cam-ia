import type { Evaluator, Project, ProjectMember } from "@/types";

export function normalizeDocument(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").trim();
}

export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export type EvaluatorProjectConflict = {
  hasConflict: boolean;
  reason?: string;
};

export function hasEvaluatorProjectConflict(
  evaluator: Pick<Evaluator, "documento_evaluador" | "correo_evaluador">,
  project: Project,
  projectIntegrantes: ProjectMember[],
): EvaluatorProjectConflict {
  const evaluatorDocument = normalizeDocument(evaluator.documento_evaluador);
  const evaluatorEmail = normalizeEmail(evaluator.correo_evaluador);
  const identities = [
    ...projectIntegrantes.map((member) => ({
      document: member.documento,
      email: member.correo,
    })),
    { document: project.aprendiz_1_documento, email: project.aprendiz_1_correo },
    { document: project.aprendiz_2_documento, email: project.aprendiz_2_correo },
    { document: project.aprendiz_3_documento, email: project.aprendiz_3_correo },
    { document: project.instructor_documento, email: project.instructor_correo },
    { document: project.instructor_2_documento, email: project.instructor_2_correo },
    { document: project.instructor_3_documento, email: project.instructor_3_correo },
  ];

  if (
    evaluatorDocument &&
    identities.some(({ document }) => normalizeDocument(document) === evaluatorDocument)
  ) {
    return {
      hasConflict: true,
      reason: "El evaluador aparece como integrante del proyecto por documento.",
    };
  }
  if (
    evaluatorEmail &&
    identities.some(({ email }) => normalizeEmail(email) === evaluatorEmail)
  ) {
    return {
      hasConflict: true,
      reason: "El evaluador aparece como integrante del proyecto por correo.",
    };
  }
  return { hasConflict: false };
}
