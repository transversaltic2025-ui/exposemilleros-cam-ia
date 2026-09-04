import JSZip from "jszip";

import { CERTIFICATES_BUCKET } from "@/lib/supabase/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PackageCertificate {
  nombre_persona?: string | null;
  documento_persona?: string | null;
  rol_certificado?: string | null;
  tipo_certificado?: string | null;
  url_certificado?: string | null;
  nombre?: string | null;
  documento?: string | null;
  tipo?: string | null;
  archivo_certificado_url?: string | null;
}

export function sanitizeFileName(value: string) {
  return value
    .replace(/[\t\r\n]+/g, " ")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

async function downloadCertificate(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    const response = await fetch(pathOrUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  const { data, error } = await createSupabaseServerClient().storage
    .from(CERTIFICATES_BUCKET)
    .download(pathOrUrl);
  if (error || !data) throw error ?? new Error("Archivo no encontrado en Storage.");
  return Buffer.from(await data.arrayBuffer());
}

export async function createCertificatesZip(certificates: PackageCertificate[]) {
  const zip = new JSZip();
  const errors: string[] = [];
  const usedNames = new Set<string>();
  let added = 0;

  for (const certificate of certificates) {
    const nombre = certificate.nombre_persona ?? certificate.nombre ?? "Sin nombre";
    const documento = certificate.documento_persona ?? certificate.documento ?? "Sin documento";
    const tipo = certificate.rol_certificado ?? certificate.tipo_certificado ?? certificate.tipo ?? "Certificado";
    const path = certificate.url_certificado ?? certificate.archivo_certificado_url;
    try {
      if (!path) throw new Error("El registro no tiene archivo de certificado.");
      const baseName = sanitizeFileName(`${tipo} - ${nombre} - ${documento}`) || "certificado";
      let fileName = `${baseName}.pdf`;
      let suffix = 2;
      while (usedNames.has(fileName.toLowerCase())) fileName = `${baseName} (${suffix++}).pdf`;
      usedNames.add(fileName.toLowerCase());
      zip.file(fileName, await downloadCertificate(path));
      added += 1;
    } catch (error) {
      errors.push([
        `Nombre: ${nombre}`,
        `Documento: ${documento}`,
        `Tipo: ${tipo}`,
        `Motivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
      ].join(" | "));
    }
  }

  if (errors.length) zip.file("errores-descarga.txt", errors.join("\r\n"));
  if (!added && !errors.length) return null;
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
