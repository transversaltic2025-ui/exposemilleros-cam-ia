import { createSupabaseServerClient } from "@/lib/supabase/server";

import { DEFAULT_TEXT_POSITIONS, type CertificateTemplate, type CertificateTemplateType, type TextPosition } from "@/types/certificate-template";
export { CERTIFICATE_TEMPLATE_TYPES, DEFAULT_TEXT_POSITIONS } from "@/types/certificate-template";
export type { CertificateTemplate, CertificateTemplateType, TextPosition } from "@/types/certificate-template";

export const MISSING_TEMPLATES_TABLE_MESSAGE =
  "No existe la tabla certificados_plantillas. Ejecute el SQL de configuración antes de subir la plantilla.";

export function isMissingTemplatesTableError(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.includes("certificados_plantillas")),
  );
}

export function templateTypeForCertificate(type: string): CertificateTemplateType {
  if ((["General", "Ponentes", "Instructores", "Líder de proyecto", "Evaluadores", "Evaluador productores campesinos", "Productores campesinos", "Jóvenes emprendedores"] as string[]).includes(type)) {
    return type as CertificateTemplateType;
  }
  if (type === "Ponente") return "Ponentes";
  if (type === "Instructor") return "Instructores";
  if (type === "Líder de proyecto") return "Líder de proyecto";
  if (type === "Evaluador") return "Evaluadores";
  if (type === "Evaluador productores campesinos") return "Evaluador productores campesinos";
  if (type === "Productor campesino participante") return "Productores campesinos";
  if (type === "Joven emprendedor participante") return "Jóvenes emprendedores";
  return "General";
}

export async function listCertificateTemplates() {
  const { data, error } = await createSupabaseServerClient()
    .from("certificados_plantillas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTemplatesTableError(error)) return { templates: [], tableMissing: true };
    throw error;
  }

  return { templates: (data ?? []) as CertificateTemplate[], tableMissing: false };
}

export async function getActiveCertificateTemplate(certificateType: string) {
  const supabase = createSupabaseServerClient();
  const requestedType = templateTypeForCertificate(certificateType);

  for (const type of requestedType === "General" ? ["General"] : [requestedType, "General"]) {
    const { data, error } = await supabase
      .from("certificados_plantillas")
      .select("*")
      .eq("tipo_certificado", type)
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingTemplatesTableError(error)) throw new Error(MISSING_TEMPLATES_TABLE_MESSAGE);
      throw error;
    }
    if (data) {
      if (process.env.NODE_ENV === "development") {
        console.log("[certificates/template] plantilla resuelta", {
          templateId: data.id,
          tipo_certificado_solicitado: certificateType,
          tipo_plantilla: data.tipo_certificado,
          archivo_path: data.archivo_path,
          posiciones: data.posiciones,
        });
      }
      return data as CertificateTemplate;
    }
  }

  return null;
}

export function textPositionsFromTemplate(template: CertificateTemplate) {
  const saved = template.posiciones;
  const missing = (["nombre", "documento", "rol"] as const).filter(field => !saved?.[field]);
  if (missing.length) {
    console.warn("[certificates/template] posiciones incompletas; se usarán valores seguros", {
      templateId: template.id,
      campos: missing,
    });
  }
  const usesPreviousDefaults =
    saved?.nombre?.x === 420 && saved.nombre.y === 390 && saved.nombre.size === 28 && saved.nombre.maxWidth === 700 &&
    saved?.documento?.x === 420 && saved.documento.y === 360 && saved.documento.size === 15 && saved.documento.maxWidth === 500 &&
    saved?.rol?.x === 420 && saved.rol.y === 295 && saved.rol.size === 18 && saved.rol.maxWidth === 260;

  if (usesPreviousDefaults) return DEFAULT_TEXT_POSITIONS;

  return {
    nombre: { ...DEFAULT_TEXT_POSITIONS.nombre, ...(saved?.nombre ?? {}), align: "center" } as TextPosition,
    documento: { ...DEFAULT_TEXT_POSITIONS.documento, ...(saved?.documento ?? {}), align: "left" } as TextPosition,
    rol: { ...DEFAULT_TEXT_POSITIONS.rol, ...(saved?.rol ?? {}), align: "center" } as TextPosition,
  };
}
