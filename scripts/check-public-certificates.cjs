const { createClient } = require('@supabase/supabase-js');
async function main() {
 const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
 for (const column of ['id','nombre_persona','documento_persona','tipo_certificado','proyecto_id','iniciativa_id','proyecto_nombre','nombre_proyecto','estado_firma','certificado_firmado_path','certificado_firmado_nombre','certificado_firmado_at']) {
  const { error } = await db.from('certificados').select(column, {head:true}).limit(0);
  console.log(column + ': ' + (error ? error.code || 'CONNECTION_ERROR' : 'OK'));
  if(error) console.log('  detail: ' + String(error.message).slice(0, 300));
 }
 const {data,error} = await db.from('certificados').select('certificado_firmado_path,certificado_firmado_nombre').eq('estado_firma','Firmado').not('certificado_firmado_path','is',null).limit(1);
 if(error) throw error;
 if(data.length) {
  const result = await db.storage.from('certificates').createSignedUrl(data[0].certificado_firmado_path,600,{download:data[0].certificado_firmado_nombre || true});
  console.log('Signed URL sample: ' + (result.error ? result.error.message : 'OK'));
 } else console.log('Signed URL sample: no signed certificates');
}
main().catch(() => {console.error('Diagnostic failed');process.exitCode=1;});
