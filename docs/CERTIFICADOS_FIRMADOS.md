# Certificados firmados

Aplicar `docs/CERTIFICADOS_FIRMADOS.sql` en el SQL Editor de Supabase antes del despliegue. Es idempotente: agrega los campos faltantes, un documento normalizado calculado e indexado y una tabla privada para errores de asociación. No modifica los PDF generados ni sus referencias. Mantiene el bucket `certificates` privado y restringe su acceso directo a claves públicas. Las operaciones de Next.js usan `SUPABASE_SERVICE_ROLE_KEY`.

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
