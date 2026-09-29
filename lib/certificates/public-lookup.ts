import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeDocument } from "./signed-matching";
import { matchesSearchName } from "./public-search";
import type { SignedCertificate } from "@/types/signed-certificate";

// Normalize stored documents and names on the server so accented names work without requiring a
// database extension or changing the existing certificate schema. Never send
// the scanned rows to the browser; only the bounded matching projection leaves.
export async function lookupPublicCertificates(documento: string, nombre: string) {
  const db = createSupabaseServerClient();
  const signed: SignedCertificate[] = [];
  let matchedCount = 0;
  let signedCount = 0;
  let pending = false;
  let missingPath = false;
  for (let offset = 0; ; offset += 500) {
    const query = db.from("certificados").select("id,nombre_persona,documento_persona,tipo_certificado,estado_firma,certificado_firmado_path,certificado_firmado_nombre,certificado_firmado_at").order("id").range(offset, offset + 499);
    const { data, error } = await query;
    if (error) throw error;
    for (const row of data as SignedCertificate[]) {
      if (documento ? normalizeDocument(row.documento_persona) !== normalizeDocument(documento) : !matchesSearchName(row.nombre_persona ?? "", nombre)) continue;
      matchedCount++;
      if (row.estado_firma === "Firmado") {
        signedCount++;
        if (row.certificado_firmado_path?.trim()) signed.push(row);
        else missingPath = true;
      } else pending = true;
      if (!documento && signed.length > 20) break;
    }
    if ((!documento && signed.length > 20) || data.length < 500) break;
  }
  const truncated = !documento && signed.length > 20;
  const rows = documento ? signed : signed.slice(0, 20);
  return { rows, pending, missingPath, truncated, matchedCount, signedCount };
}
