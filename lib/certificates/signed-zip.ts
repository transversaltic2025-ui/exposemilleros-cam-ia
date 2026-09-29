import JSZip from "jszip";
import { Readable } from "node:stream";
import { matchSignedCertificate } from "./signed-matching";
import { listSignedCertificates, MAX_SIGNED_PDF, MAX_SIGNED_ZIP, saveSignedCertificate } from "./signed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UploadResult } from "@/types/signed-certificate";
import { signedCertificateError } from "./signed-schema";

async function boundedPdf(entry: JSZip.JSZipObject) {
  const chunks: Buffer[] = [];
  let size = 0;
  const stream = new Readable({ read() {} }).wrap(entry.nodeStream("nodebuffer") as Readable);
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_SIGNED_PDF) throw new Error("El PDF supera 15 MB descomprimido.");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function uploadSignedZip(bytes: Buffer, replace: boolean, cursor = 0, limit = 30) {
  if (bytes.length > MAX_SIGNED_ZIP) throw new Error("El ZIP debe pesar máximo 50 MB.");
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.values(zip.files).filter(entry => !entry.dir && !entry.name.startsWith("__MACOSX/"));
  if (entries.length > 200) throw new Error("El ZIP admite máximo 200 archivos.");
  if (!entries.some(entry => /\.pdf$/i.test(entry.name))) throw new Error("El ZIP no contiene archivos PDF.");
  // Check the whole archive, including files outside this batch. JSZip retains
  // the central-directory sizes; boundedPdf also checks actual inflated bytes.
  const expandedSize = entries.reduce((sum, entry) => {
    const size = (entry as unknown as { _data: { uncompressedSize: number } })._data.uncompressedSize;
    if (!Number.isSafeInteger(size) || size < 0) throw new Error("Tamaño ZIP inválido.");
    return sum + size;
  }, 0);
  if (expandedSize > 200 * 1024 * 1024) throw new Error("El ZIP supera 200 MB descomprimidos.");
  const pdfs = entries.filter(entry => /\.pdf$/i.test(entry.name));
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > pdfs.length || !Number.isInteger(limit) || limit < 1 || limit > 30) throw new Error("Cursor o límite inválido.");
  const certificates = await listSignedCertificates();
  const results: UploadResult[] = [];
  const seen = new Set<string>();
  for (const entry of pdfs.slice(0, cursor)) {
    const previous = matchSignedCertificate(entry.name, certificates);
    if (previous.certificate) seen.add(previous.certificate.id);
  }
  const started = Date.now();
  let historyWarning = "";
  for (const entry of pdfs.slice(cursor, cursor + limit)) {
    // Return a smaller batch before approaching the function deadline.
    if (results.length && Date.now() - started > 45_000) break;
    if (!/\.pdf$/i.test(entry.name)) continue;
    const match = matchSignedCertificate(entry.name, certificates);
    const result: UploadResult = { archivo: entry.name, documento: match.documento, tipo: match.tipo,
      certificado: match.certificate ? `${match.certificate.nombre_persona} · ${match.certificate.tipo_certificado} · ${match.certificate.proyecto_codigo ?? match.certificate.id}` : undefined,
      estado: "No asociado", motivo: match.motivo };
    try {
      if (!match.certificate) {
        // Recorded below without interrupting the other files.
      } else if (seen.has(match.certificate.id)) {
        result.estado = "Duplicado"; result.motivo = "Otro PDF del ZIP corresponde al mismo certificado.";
      } else {
        seen.add(match.certificate.id);
        if (match.certificate.certificado_firmado_path && !replace) {
          result.estado = "Duplicado"; result.motivo = "Ya existe un firmado. Requiere confirmación de reemplazo.";
        } else {
          const pdf = await boundedPdf(entry);
          result.estado = await saveSignedCertificate(match.certificate, entry.name, pdf, replace);
          result.motivo = "Certificado firmado disponible para descarga.";
        }
      }
    } catch (error) {
      result.estado = "Error";
      result.motivo = signedCertificateError(error, "No se pudo guardar el certificado firmado.");
    }
    if (result.estado === "No asociado" || result.estado === "Error") {
      try {
        const { error } = await createSupabaseServerClient().from("certificados_firma_errores").insert({
          archivo_nombre: result.archivo, documento_detectado: result.documento || null,
          tipo_detectado: result.tipo || null, certificado_id: match.certificate?.id ?? null,
          estado: result.estado, motivo: result.motivo, detalle_tecnico: result.motivo,
        });
        if (error) throw error;
      } catch (error) {
        historyWarning = signedCertificateError(error, "No se pudo guardar el historial de errores.");
      }
    }
    results.push(result);
  }
  return { success: true, results, warning: historyWarning || undefined,
    processed: results.length,
    associated: results.filter(row => ["Asociado", "Reemplazado"].includes(row.estado)).length,
    notAssociated: results.filter(row => ["No asociado", "Duplicado"].includes(row.estado)).length,
    errors: results.filter(row => row.estado === "Error").length,
    remaining: pdfs.length - cursor - results.length, nextCursor: cursor + results.length,
    message: "Lote procesado correctamente.", resumen: {
    procesados: results.length,
    asociados: results.filter(row => row.estado === "Asociado" || row.estado === "Reemplazado").length,
    noAsociados: results.filter(row => row.estado === "No asociado").length,
    duplicados: results.filter(row => row.estado === "Duplicado").length,
    reemplazados: results.filter(row => row.estado === "Reemplazado").length,
    errores: results.filter(row => row.estado === "Error").length,
  } };
}
