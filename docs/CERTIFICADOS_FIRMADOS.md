# Certificados firmados

Aplicar `docs/CERTIFICADOS_FIRMADOS.sql` en el SQL Editor de Supabase antes del despliegue. Es idempotente: agrega los campos faltantes, un documento normalizado calculado e indexado y una tabla privada para errores de asociación. No modifica los PDF generados ni sus referencias. Mantiene el bucket `certificates` privado y restringe su acceso directo a claves públicas. Las operaciones de Next.js usan `SUPABASE_SERVICE_ROLE_KEY`.

El módulo comprueba individualmente las siete columnas de firma y `rol_participacion`, incluso si la tabla está vacía, e indica cada columna faltante. La migración incluye `rol_participacion`. Los registros disponibles siguen visibles cuando falta una columna o falla el historial de asociaciones; las cargas se deshabilitan si faltan columnas o no se puede verificar el bucket privado `certificates`. Un fallo del historial no impide cargar PDFs asociados. Los resultados no asociados siguen apareciendo en el informe ZIP aunque no se pueda persistir su historial. Los estados de firma nulos se leen como `Pendiente de firma`.

## Uso

1. Generar y descargar los certificados desde el módulo existente. Firmarlos externamente.
2. Abrir `/admin/certificados/firmados` con la sesión admin existente.
3. Buscar por documento, nombre, tipo o código de proyecto, seleccionar el registro y cargar un PDF de máximo 15 MB. Para resolver un error ZIP, pulsar «Resolver manualmente», seleccionar el registro y adjuntar nuevamente el PDF.
4. Para carga masiva, subir un ZIP de máximo 50 MB, 200 archivos y 200 MB descomprimidos. Se procesan solo PDFs, excluyendo metadatos de macOS. Usar `TIPO - NOMBRE COMPLETO - DOCUMENTO.pdf`, por ejemplo `Evaluador - Yesny Alejandra Chavez Veloza - 1120563238.pdf`. El documento debe contener al menos 5 dígitos; se eliminan espacios, puntos y guiones. También se conservan los formatos anteriores con documento al inicio o en medio, por ejemplo `ponente-1029988863-juan.pdf`. Se detecta el tipo antes del primer guion: Evaluador, Ponente, Líder de proyecto (con o sin tilde), Investigador o Evaluador productores campesinos. Si se detecta un tipo, debe coincidir con el registro incluso si existe un solo certificado para el documento. Si persisten varias coincidencias, se registra un error sin modificar arbitrariamente certificados existentes. Si no hay coincidencia de documento y tipo, el resultado es «No asociado» con motivo «No se encontró certificado generado para este documento y tipo.».
5. Revisar el informe por archivo. Los duplicados del mismo registro dentro del ZIP no se sobrescriben. Reemplazar versiones previas requiere marcar la casilla y confirmar.
6. Los participantes acceden a `/certificados/consultar` desde el inicio. Los enlaces duran 10 minutos; volver a consultar los renueva.

## Persistencia y seguridad

- Primer archivo: `firmados/[tipo]/[documento]-[nombre-limpio].pdf`. Si existe una colisión o se reemplaza una versión, se agrega un UUID al nombre. Esto evita mezclar certificados de distintos proyectos de una misma persona y permite conservar el firmado activo si falla la actualización de Database.
- Se carga sin `upsert`; Database se actualiza solo si la referencia anterior no cambió. Si falla, se elimina la nueva carga. Tras guardar, se retira el archivo anterior. Si Storage falla al retirarlo, queda un objeto privado sin referencia activa y se registra el fallo en el servidor.
- El último activo siempre queda en estado `Firmado`. El informe de carga distingue `Reemplazado`.
- `certificado_firmado_subido_por` registra `admin`: la autenticación compartida existente no identifica personas; no se crea un sistema de usuarios nuevo.
- Los errores sin asociación se guardan en `certificados_firma_errores`, no sobre un registro de persona elegido arbitrariamente. El resumen incluye los errores pendientes; la pantalla permite resolver los 200 más recientes.
- La API pública acepta solo el documento, hace una coincidencia exacta normalizada y devuelve campos explícitos sin documento ni columnas de Storage. La URL firmada de Supabase necesariamente contiene su ruta como parte del enlace, pero no permite acceso sin token válido. No se devuelve una URL permanente ni un campo con el path.
- La consulta por documento es el mecanismo solicitado, no una prueba de identidad. Configurar límites de frecuencia en el proxy de producción para impedir consultas automatizadas; el límite local del servidor es una protección adicional por instancia.
- Los PDFs se verifican por extensión, cabecera y tamaño; el módulo no valida criptográficamente la firma externa.
- El hosting debe admitir cuerpos multipart de 50 MB y hasta 300 segundos para ZIP. Si el proveedor impone un límite menor, usar lotes compatibles o configurar el proxy. Los límites del proveedor se aplican antes de la API.

## Verificación

`node scripts/test-signed-certificates.cjs` cubre normalización, asociación, ambigüedad, duplicados ZIP, restricciones de archivos, reemplazo, fallos de persistencia y consulta pública. `node scripts/test-certificates.cjs` conserva la prueba de generación existente. Ejecutar `npm.cmd run build`.

Para aceptación en Supabase: cargar un PDF, consultar su documento con y sin separadores, descargar, intentar reemplazar sin confirmar, reemplazar confirmado, subir ZIP mixto y resolver un error. Verificar acceso anónimo denegado al bucket y tabla, y expiración de un enlace transcurridos 10 minutos.


## Carga ZIP directa a Storage (Vercel)

Aplicar `docs/CERTIFICADOS_FIRMADOS_ZIP.sql` después de la migración base. Crea o adapta el historial sin borrar datos y permite ZIP de hasta 50 MB en el bucket existente. Revisar también que el límite global de Storage admita 50 MB. No se expone la clave de servicio al navegador.

La interfaz obtiene una URL firmada en `create-zip-upload-url`, hace PUT del ZIP directamente a Storage y llama a `process-zip` (primer lote) y `process-zip-batch` (siguientes). Reciben `{zipPath, cursor, limit, replaceExisting}`; cursor predeterminado 0, límite predeterminado y máximo 30. Devuelven resultados por archivo, conteos, remaining y nextCursor. El endpoint antiguo responde JSON 410; Vercel puede rechazar su cuerpo antes de ejecutar código.

Límites: 50 MB comprimidos, 200 entradas de archivo, 200 MB descomprimidos en el ZIP completo y 15 MB por PDF. Cada lote se detiene entre archivos después de 45 segundos de procesamiento y devuelve el cursor real. Se ignoran carpetas y metadatos __MACOSX.

Si el historial no existe, los resultados siguen disponibles en pantalla y la carga continúa con un aviso. Resolver manualmente cambia estado a Resuelto. La coincidencia exige documento y tipo; los nombres normalizados desempatan registros múltiples. Un archivo duplicado en otro lote no reemplaza al primero.

Mantener la página abierta hasta terminar. Ante un fallo de red se conservan resultados parciales; revisar antes de volver a enviar el ZIP, especialmente si se permite reemplazar. Los ZIP originales quedan en la carpeta privada `firmados/zips/`; retirarlos desde Storage cuando ya no sean necesarios. No eliminar los PDF asociados.

Validación operativa: probar un ZIP mayor de 4,5 MB, al menos 31 PDF, documento inexistente, nombres ambiguos, reemplazo desactivado/activado y descarga pública del firmado. La prueba real requiere Supabase configurado y un despliegue Vercel.

Contrato de URL firmada: enviar JSON `{fileName, fileType, fileSize}` a `create-zip-upload-url`; devuelve `{success, path, token, signedUrl}`. El nombre original se limpia y se agrega timestamp y UUID para evitar colisiones. Enviar el archivo por PUT a `signedUrl`, y usar `path` como `zipPath` al procesar. Nunca enviar el ZIP a Next.js. El progreso incluye los restantes desde la respuesta del primer lote.
