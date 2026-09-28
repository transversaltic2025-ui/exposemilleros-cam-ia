// Read-only schema/storage check. Run: node --env-file=.env.local scripts/check-signed-certificates.cjs
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  for (const column of [
    'certificado_firmado_path', 'certificado_firmado_nombre', 'certificado_firmado_tipo',
    'certificado_firmado_size', 'certificado_firmado_at', 'certificado_firmado_subido_por',
    'estado_firma', 'rol_participacion',
  ]) {
    const { error } = await db.from('certificados').select(column, { head: true }).limit(0);
    console.log(`certificados.${column}: ${error ? error.code || 'CONNECTION_ERROR' : 'OK'}`);
    if (error) process.exitCode = 1;
    if (error && !error.code) return;
  }
  const { error: historyError } = await db.from('certificados_firma_errores').select('id,archivo,documento,motivo,resuelto,created_at', { head: true }).limit(0);
  console.log(`certificados_firma_errores: ${historyError ? historyError.code || 'CONNECTION_ERROR' : 'OK'}`);
  for (const [table, columns] of [
    ['certificados', '*,certificado_firmado_path,certificado_firmado_nombre,certificado_firmado_tipo,certificado_firmado_size,certificado_firmado_at,certificado_firmado_subido_por,estado_firma,rol_participacion'],
    ['proyectos', 'id,nombre_proyecto,codigo_proyecto'],
  ]) {
    const { error: queryError } = await db.from(table).select(columns, { head: true }).limit(0);
    console.log(`Consulta ${table}: ${queryError ? queryError.code || 'CONNECTION_ERROR' : 'OK'}`);
    if (queryError) process.exitCode = 1;
  }
  const { data, error } = await db.storage.getBucket('certificates');
  console.log(`bucket certificates: ${error ? error.status || error.statusCode || 'CONNECTION_ERROR' : data.public ? 'PUBLIC' : 'PRIVATE'}`);
  if (historyError || error || data?.public) process.exitCode = 1;
}
main().catch(() => { console.error('No fue posible ejecutar el diagnóstico. Verifique la configuración y conexión del servidor.'); process.exitCode = 1; });
