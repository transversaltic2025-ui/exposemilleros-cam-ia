import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CERTIFICATES_BUCKET } from "@/lib/supabase/storage";
import type { SignedCertificate } from "@/types/signed-certificate";

export class CertificateDownloadError extends Error {
  constructor(readonly detail: string) {
    super("No se pudo generar el enlace de descarga del certificado firmado.");
  }
}
export async function publicCertificateDownload(row: SignedCertificate, context?: { documento: string; matchedCount: number | null }) {
  try {
    if (row.estado_firma !== "Firmado" || !row.certificado_firmado_path) throw new Error("Certificado sin firmado disponible.");
    // The path comes exclusively from the database, never from public input.
    // Accept existing Storage object names, including spaces and accents.
    const { data, error } = await createSupabaseServerClient().storage.from(CERTIFICATES_BUCKET)
      .createSignedUrl(row.certificado_firmado_path, 600);
    if (error) throw error;
    if (!data?.signedUrl) throw new Error("Storage no devolvi\u00f3 un enlace.");
    return data.signedUrl;
  } catch (error) {
    console.error("[certificados-consultar]", { ...context, certificadoId: row.id, path: row.certificado_firmado_path, signedError: error });
    throw new CertificateDownloadError(errorDetail(error));
  }
}

function errorDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return String(error);
}
export function publicLookupError(error: unknown) {
  return `Error consultando certificados: ${errorDetail(error)}`;
}
