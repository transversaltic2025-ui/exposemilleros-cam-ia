import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CERTIFICATES_BUCKET } from "@/lib/supabase/storage";

export const SIGNED_CERTIFICATE_COLUMNS = [
  "certificado_firmado_path", "certificado_firmado_nombre", "certificado_firmado_tipo",
  "certificado_firmado_size", "certificado_firmado_at", "certificado_firmado_subido_por",
  "estado_firma",
] as const;

export function signedCertificateError(error: unknown, fallback = "No fue posible consultar los certificados firmados.") {
  const detail = error && typeof error === "object" ? error as { code?: string; message?: string } : {};
  const message = detail.message ?? "";
  if (detail.code === "42703" || detail.code === "PGRST204") {
    const column = message.match(/column\s+(?:[\w]+\.)?["']?([\w]+)["']?\s+does not exist/i)?.[1]
      ?? message.match(/['"]([\w]+)['"] column/i)?.[1];
    const table = message.match(/column\s+([\w]+)\./i)?.[1]
      ?? message.match(/['"]([\w]+)['"]\s+in the schema cache/i)?.[1] ?? "certificados";
    if (column) return `Falta la columna ${table}.${column}. Ejecute la migración de certificados firmados.`;
  }
  if (detail.code === "42P01" || detail.code === "PGRST205") {
    const table = message.match(/(?:public\.|relation\s+["']?)([\w]+)/i)?.[1] ?? "certificados_firma_errores";
    return `Falta la tabla ${table}. Aplique docs/CERTIFICADOS_FIRMADOS_ZIP.sql para habilitar el historial. Ejecute la migración de certificados firmados.`;
  }
  if (/bucket.*not found/i.test(message)) return `No existe el bucket ${CERTIFICATES_BUCKET} en Supabase Storage.`;
  if (detail.code === "42501" || /permission denied|not authorized|invalid api key/i.test(message)) return "Supabase denegó el acceso. Verifique los permisos y la clave de servicio del servidor.";
  if (/fetch failed|network|timeout|connect/i.test(message)) return "No se pudo conectar con Supabase. Verifique la conexión del servidor.";
  if (/Missing Supabase server environment variables/i.test(message)) return "Falta configurar NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor.";
  return message || (detail.code ? `${fallback} Código: ${detail.code}.` : fallback);
}

export async function inspectSignedCertificateColumns() {
  const db = createSupabaseServerClient();
  const checks = await Promise.all(SIGNED_CERTIFICATE_COLUMNS.map(async column => {
    const { error } = await db.from("certificados").select(column, { head: true }).limit(0);
    if (error && error.code !== "42703" && error.code !== "PGRST204") throw error;
    return error ? column : null;
  }));
  return checks.filter((column): column is typeof SIGNED_CERTIFICATE_COLUMNS[number] => column !== null);
}

export async function inspectSignedCertificateBucket() {
  const { data, error } = await createSupabaseServerClient().storage.getBucket(CERTIFICATES_BUCKET);
  if (error) throw error;
  if (data.public) throw new Error(`El bucket ${CERTIFICATES_BUCKET} debe ser privado para usar descargas temporales seguras.`);
}
