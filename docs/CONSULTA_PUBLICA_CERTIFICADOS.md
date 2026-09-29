# Consulta pública de certificados

`POST /api/certificados/consultar` es público y recibe un documento (`{"documento":"1074131863"}`). La implementación actual sigue el contrato solicitado de consulta por documento; la pantalla ya no ofrece búsqueda por nombre.

El endpoint crea su cliente con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, desactiva persistencia de sesión y consulta solamente las ocho columnas indicadas en el archivo de ruta. Normaliza el documento ingresado y el guardado, eliminando caracteres no numéricos. Lee una consulta sin paginar, adecuada al volumen actual de 308 registros: si la tabla supera el límite de filas de PostgREST, deberá incorporarse paginación.

El estado firmado se compara sin espacios externos ni distinción de mayúsculas. Se limpian espacios externos del path; no se agrega el nombre del bucket. La firma usa `storage.from("certificates").createSignedUrl(path, 600)`. Los registros válidos se descargan incluso si otro registro coincidente no tiene archivo.

La API devuelve JSON para falta de configuración, JSON malformado, documento vacío, ausencia de certificados, pendientes, firmados sin ruta, errores de consulta, errores de firma y excepciones inesperadas. Los errores de consulta incluyen el mensaje original en `detail`; los de Storage incluyen además `path`, conforme al contrato de diagnóstico solicitado. No se devuelven claves ni objetos completos de Supabase.

La pantalla muestra `message` y `detail` como texto y abre `downloadUrl` en otra pestaña. Se mantienen cabeceras no-store/private y no-referrer. El POST actual no usa los helpers anteriores de búsqueda o límite de consultas.

Pruebas: `node scripts/test-signed-certificates.cjs`.
Prueba real de solo lectura: `node --env-file=.env.local scripts/check-certificate-download.cjs DOCUMENTO`.
Build: `npm.cmd run build`.

Los logs temporales `[certificados-consultar]` muestran documento normalizado, total consultado, coincidencias, firmados y, si falla Storage, ID, path y error. Los cambios locales deben desplegarse para que se apliquen en Vercel.
