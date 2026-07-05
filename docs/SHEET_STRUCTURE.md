# ExpoSemilleros CAM IA - Estructura de Google Sheets

Google Sheets funcionara como base de datos liviana. Cada hoja debe tener encabezados estables, en snake_case, para facilitar lectura desde Google Apps Script y Next.js.

## Hoja `proyectos`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| codigo | string | Codigo publico unico del proyecto. |
| fecha_registro | datetime | Fecha de inscripcion. |
| titulo | string | Nombre del proyecto. |
| resumen | string | Resumen corto registrado. |
| area_conocimiento | string | Area usada para asignar evaluadores. |
| linea_investigacion | string | Linea o subtema del proyecto. |
| institucion | string | Centro, ficha o institucion. |
| municipio | string | Municipio del proyecto. |
| integrantes | string | Nombres de participantes separados por punto y coma. |
| documentos_integrantes | string | Documentos internos separados por punto y coma. No publico. |
| instructor_nombre | string | Instructor responsable. |
| instructor_correo | string | Correo interno. No publico. |
| instructor_celular | string | Celular interno. No publico. |
| archivo_drive_id | string | ID del archivo en Google Drive. |
| archivo_url | string | URL privada o controlada del archivo. |
| estado | enum | recibido, asignado, evaluado, certificado. |
| requiere_certificado | boolean | Marca para generacion de certificados. |

## Hoja `evaluadores`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| evaluador_id | string | ID interno unico. |
| fecha_registro | datetime | Fecha de registro. |
| nombre | string | Nombre completo. |
| correo | string | Correo interno para envio de tokens. |
| celular | string | Celular interno. |
| documento | string | Documento interno para certificados. |
| entidad | string | Entidad o dependencia. |
| area_conocimiento | string | Area de experiencia. |
| disponibilidad | string | Franja o disponibilidad declarada. |
| max_proyectos | number | Maximo permitido, por defecto 3. |
| estado | enum | disponible, completo, inactivo. |
| requiere_certificado | boolean | Marca para certificado de evaluador. |

## Hoja `asignaciones`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| asignacion_id | string | ID unico de asignacion. |
| codigo_proyecto | string | Referencia a `proyectos.codigo`. |
| evaluador_id | string | Referencia a `evaluadores.evaluador_id`. |
| area_conocimiento | string | Area que justifica la asignacion. |
| token | string | Token unico para evaluar sin login. |
| fecha_asignacion | datetime | Fecha de asignacion. |
| estado | enum | pendiente, abierta, enviada, vencida. |
| archivo_abierto | boolean | Evidencia de apertura del archivo por evaluador. |
| fecha_apertura_archivo | datetime | Primera apertura registrada. |

## Hoja `evaluaciones`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| evaluacion_id | string | ID unico. |
| asignacion_id | string | Referencia a asignacion. |
| codigo_proyecto | string | Referencia a proyecto. |
| evaluador_id | string | Referencia a evaluador. |
| puntaje_pertinencia | number | Puntaje por criterio. |
| puntaje_innovacion | number | Puntaje por criterio. |
| puntaje_metodologia | number | Puntaje por criterio. |
| puntaje_impacto | number | Puntaje por criterio. |
| puntaje_comunicacion | number | Puntaje por criterio. |
| puntaje_total | number | Suma o promedio ponderado. |
| observaciones | string | Observaciones generales. |
| fortalezas | string | Fortalezas del proyecto. |
| oportunidades | string | Oportunidades de mejora. |
| recomendacion_final | enum | destacado, aprobar, ajustar, no_recomendado. |
| concepto_evaluador | string | Concepto final humano. |
| fecha_envio | datetime | Fecha de envio. |

## Hoja `analisis_ia`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| analisis_id | string | ID unico. |
| codigo_proyecto | string | Referencia a proyecto. |
| archivo_drive_id | string | Archivo analizado. |
| resumen_ia | string | Resumen generado por IA. |
| tendencias_identificadas | string | Tendencias separadas por punto y coma. |
| puntaje_sugerido_ia | number | Puntaje sugerido por IA. |
| nivel_tendencia_ia | enum | bajo, medio, alto, sobresaliente. |
| concepto_ia | string | Concepto final IA. |
| fecha_analisis | datetime | Fecha de analisis. |

## Hoja `certificados`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| certificado_id | string | ID unico. |
| tipo | enum | participante, instructor, evaluador. |
| nombre | string | Nombre para certificado. |
| documento | string | Documento interno si aplica. |
| codigo_proyecto | string | Proyecto asociado si aplica. |
| rol | string | Rol certificado. |
| fecha_evento | date | Fecha del evento. |
| estado | enum | pendiente, generado, enviado. |
| archivo_certificado_url | string | URL futura del certificado. |
