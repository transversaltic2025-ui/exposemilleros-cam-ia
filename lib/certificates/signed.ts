import { createSupabaseServerClient } from "@/lib/supabase/server";
import { certificateTypeToStorageFolder, sanitizeStorageKey } from "./storage-key";
import { normalizeDocument } from "./signed-matching";
import type { SignedCertificate } from "@/types/signed-certificate";

export const MAX_SIGNED_PDF = 15 * 1024 * 1024;
export const MAX_SIGNED_ZIP = 50 * 1024 * 1024;

export function validateSignedPdf(name: string, bytes: Buffer) {
  if (!/\.pdf$/i.test(name) || bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("El archivo debe ser un PDF válido.");
  if (bytes.length > MAX_SIGNED_PDF) throw new Error("Cada PDF debe pesar máximo 15 MB.");
}

export async function listSignedCertificates(document?: string) {
  const db = createSupabaseServerClient();
  const rows: SignedCertificate[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = db.from("certificados").select("*").order("id").range(offset, offset + 999);
    if (document !== undefined) query = query.eq("documento_normalizado", normalizeDocument(document));
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data as SignedCertificate[]));
    if (data.length < 1000) break;
  }
  const ids = [...new Set(rows.map(row => row.proyecto_id).filter(Boolean))] as string[];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await db.from("proyectos").select("id,nombre_proyecto,codigo_proyecto").in("id", ids.slice(offset, offset + 100));
    if (error) throw error;
    for (const project of data ?? []) for (const row of rows) if (row.proyecto_id === project.id) {
      row.proyecto_nombre = project.nombre_proyecto;
      row.proyecto_codigo = project.codigo_proyecto;
    }
  }
  const initiativeIds = [...new Set(rows.map(row => row.iniciativa_id).filter(Boolean))] as string[];
  for (let offset = 0; offset < initiativeIds.length; offset += 100) {
    const { data, error } = await db.from("productores_iniciativas").select("id,nombre_iniciativa,codigo_iniciativa").in("id", initiativeIds.slice(offset, offset + 100));
    if (error) throw error;
    for (const initiative of data ?? []) for (const row of rows) if (row.iniciativa_id === initiative.id) {
      row.iniciativa_nombre = initiative.nombre_iniciativa;
      row.iniciativa_codigo = initiative.codigo_iniciativa;
    }
  }
  return rows;
}

export async function signedDownload(path: string, name?: string | null) {
  if (!/^firmados\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(path)) throw new Error("Ruta de certificado firmado inválida.");
  const { data, error } = await createSupabaseServerClient().storage.from("certificates")
    .createSignedUrl(path, 600, { download: name || true });
  if (error) throw error;
  return data.signedUrl;
}

export async function saveSignedCertificate(certificate: SignedCertificate, filename: string, bytes: Buffer, replace: boolean) {
  validateSignedPdf(filename, bytes);
  if (certificate.certificado_firmado_path && !replace) throw new Error("El certificado ya tiene un firmado. Confirme el reemplazo.");
  const document = normalizeDocument(certificate.documento_persona);
  if (!document) throw new Error("El certificado no tiene un documento válido.");
  const db = createSupabaseServerClient();
  const folder = sanitizeStorageKey(certificateTypeToStorageFolder(certificate.tipo_certificado ?? "participante"));
  const base = `${document}-${sanitizeStorageKey(certificate.nombre_persona) || "participante"}`;
  // Keep the requested canonical name on first upload. Never overwrite an active
  // object before committing its new metadata; suffix collisions and replacements.
  let path = `firmados/${folder}/${base}${certificate.certificado_firmado_path ? `-${crypto.randomUUID()}` : ""}.pdf`;
  let { error: uploadError } = await db.storage.from("certificates").upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError && ("statusCode" in uploadError && String(uploadError.statusCode) === "409" || /already exists|duplicate/i.test(uploadError.message))) {
    path = `firmados/${folder}/${base}-${crypto.randomUUID()}.pdf`;
    ({ error: uploadError } = await db.storage.from("certificates").upload(path, bytes, { contentType: "application/pdf", upsert: false }));
  }
  if (uploadError) throw uploadError;
  let update = db.from("certificados").update({
    certificado_firmado_path: path, certificado_firmado_nombre: filename.split(/[\\/]/).pop(),
    certificado_firmado_tipo: "application/pdf", certificado_firmado_size: bytes.length,
    certificado_firmado_at: new Date().toISOString(), certificado_firmado_subido_por: "admin",
    estado_firma: "Firmado",
  }).eq("id", certificate.id);
  update = certificate.certificado_firmado_path
    ? update.eq("certificado_firmado_path", certificate.certificado_firmado_path)
    : update.is("certificado_firmado_path", null);
  const { data, error } = await update.select("id");
  if (error || !data?.length) {
    await db.storage.from("certificates").remove([path]);
    throw new Error(error ? "No se pudo actualizar el registro del certificado." : "El certificado cambió durante la carga. Actualice e intente nuevamente.");
  }
  if (certificate.certificado_firmado_path?.startsWith("firmados/")) {
    const { error: cleanupError } = await db.storage.from("certificates").remove([certificate.certificado_firmado_path]);
    if (cleanupError) console.error("[certificados-firmados] No se pudo retirar la versión anterior", cleanupError);
  }
  return certificate.certificado_firmado_path ? "Reemplazado" as const : "Asociado" as const;
}
