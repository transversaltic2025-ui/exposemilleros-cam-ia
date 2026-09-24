import JSZip from "jszip";
import { Readable } from "node:stream";
import { matchSignedCertificate } from "./signed-matching";
import { listSignedCertificates, MAX_SIGNED_PDF, MAX_SIGNED_ZIP, saveSignedCertificate } from "./signed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UploadResult } from "@/types/signed-certificate";

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

export async function uploadSignedZip(bytes: Buffer, replace: boolean) {
  if (bytes.length > MAX_SIGNED_ZIP) throw new Error("El ZIP debe pesar máximo 50 MB.");
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.values(zip.files).filter(entry => !entry.dir && !entry.name.startsWith("__MACOSX/"));
  if (entries.length > 200) throw new Error("El ZIP admite máximo 200 archivos.");
  if (!entries.some(entry => /\.pdf$/i.test(entry.name))) throw new Error("El ZIP no contiene archivos PDF.");
  const certificates = await listSignedCertificates();
  const results: UploadResult[] = [];
  const seen = new Set<string>();
  let expanded = 0;
  for (const entry of entries) {
    if (!/\.pdf$/i.test(entry.name)) continue;
    const match = matchSignedCertificate(entry.name, certificates);
    const result: UploadResult = { archivo: entry.name, documento: match.documento,
      certificado: match.certificate ? `${match.certificate.nombre_persona} · ${match.certificate.tipo_certificado} · ${match.certificate.proyecto_codigo ?? match.certificate.id}` : undefined,
      estado: "No asociado", motivo: match.motivo };
    try {
      if (!match.certificate) {
        const { error } = await createSupabaseServerClient().from("certificados_firma_errores").insert({ archivo: result.archivo, documento: result.documento, motivo: result.motivo });
        if (error) throw new Error("No fue posible registrar el error de asociación.");
      } else if (seen.has(match.certificate.id)) {
        result.estado = "Duplicado"; result.motivo = "Otro PDF del ZIP corresponde al mismo certificado.";
      } else {
        seen.add(match.certificate.id);
        if (match.certificate.certificado_firmado_path && !replace) {
          result.estado = "Duplicado"; result.motivo = "Ya existe un firmado. Requiere confirmación de reemplazo.";
        } else {
          if (expanded >= 200 * 1024 * 1024) throw new Error("Se alcanzó el límite de 200 MB descomprimidos por lote.");
          const pdf = await boundedPdf(entry);
          expanded += pdf.length;
          if (expanded > 200 * 1024 * 1024) throw new Error("El lote supera 200 MB descomprimidos.");
          result.estado = await saveSignedCertificate(match.certificate, entry.name, pdf, replace);
          result.motivo = "Certificado firmado disponible para descarga.";
        }
      }
    } catch (error) {
      result.estado = "Error";
      result.motivo = error instanceof Error ? error.message : "No se pudo guardar el certificado firmado.";
    }
    results.push(result);
  }
  return { results, resumen: {
    procesados: results.length,
    asociados: results.filter(row => row.estado === "Asociado" || row.estado === "Reemplazado").length,
    noAsociados: results.filter(row => row.estado === "No asociado").length,
    duplicados: results.filter(row => row.estado === "Duplicado").length,
    reemplazados: results.filter(row => row.estado === "Reemplazado").length,
    errores: results.filter(row => row.estado === "Error").length,
  } };
}
