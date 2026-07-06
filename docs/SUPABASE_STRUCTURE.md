# ExpoSemilleros CAM IA - Estructura de Supabase

Supabase Database es la fuente principal de datos. Las tablas usan encabezados estables en snake_case para facilitar consultas desde Next.js.

## Tabla `proyectos`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| codigo | text | Codigo publico unico del proyecto. |
| fecha_registro | timestamptz | Fecha de inscripcion. |
| titulo | text | Nombre del proyecto. |
| resumen | text | Resumen corto registrado. |
| linea_tematica | text | Linea tematica declarada. |
| area_conocimiento | text | Area usada para asignar evaluadores. |
| linea_investigacion | text | Linea o subtema del proyecto. |
| modalidad_participacion | text | Modalidad declarada. |
| semillero | text | Semillero asociado. |
| categoria_presentacion | text | Categoria de presentacion. |
| institucion | text | Centro, ficha o institucion. |
| municipio | text | Municipio del proyecto. |
| participantes | jsonb | Participantes con datos internos para certificados. |
| integrantes | jsonb | Nombres visibles de integrantes. |
| instructor_nombre | text | Instructor responsable. |
| instructor_documento | text | Documento interno para certificados. |
| instructor_correo | text | Correo interno. No publico. |
| instructor_celular | text | Celular interno. No publico. |
| archivo_nombre | text | Nombre original del archivo. |
| archivo_storage_path | text | Ruta del archivo en el bucket `project-files`. |
| archivo_url | text | URL opcional de referencia. |
| estado | text | Registrado, Asignado, En evaluacion, Evaluado, Cerrado o Devuelto. |
| evaluadores_asignados | integer | Contador maximo 2. |
| requiere_certificado | boolean | Marca para generacion de certificados. |

## Tabla `evaluadores`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| evaluador_id | text | ID interno unico. |
| fecha_registro | timestamptz | Fecha de registro. |
| nombre | text | Nombre completo. |
| correo | text | Correo interno para envio de tokens. |
| celular | text | Celular interno. |
| documento | text | Documento interno para certificados. |
| entidad | text | Entidad o dependencia. |
| area_conocimiento | text | Area de experiencia. |
| disponibilidad | text | Franja o disponibilidad declarada. |
| proyectos_asignados | integer | Carga actual. |
| max_proyectos | integer | Maximo permitido, por defecto 3. |
| estado | text | Disponible, Completo o Inactivo. |
| requiere_certificado | boolean | Marca para certificado de evaluador. |

## Tabla `asignaciones`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| asignacion_id | text | ID unico de asignacion. |
| codigo_proyecto | text | Referencia a `proyectos.codigo`. |
| titulo_proyecto | text | Titulo desnormalizado para administracion. |
| evaluador_id | text | Referencia a `evaluadores.evaluador_id`. |
| evaluador_nombre | text | Nombre desnormalizado para administracion. |
| area_conocimiento | text | Area que justifica la asignacion. |
| token | text | Token unico para evaluar sin login. |
| fecha_asignacion | timestamptz | Fecha de asignacion. |
| estado | text | Pendiente, En proceso, Completada, Bloqueada o Cancelada. |
| archivo_abierto | boolean | Evidencia de apertura del archivo por evaluador. |
| fecha_apertura_archivo | timestamptz | Primera apertura registrada. |

## Tabla `criterios`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| criterio_id | text | ID unico. |
| nombre | text | Nombre del criterio. |
| descripcion | text | Descripcion operativa. |
| puntaje_maximo | integer | Puntaje maximo del criterio. |

## Tabla `evaluaciones`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| evaluacion_id | text | ID unico. |
| asignacion_id | text | Referencia a asignacion. |
| codigo_proyecto | text | Referencia a proyecto. |
| evaluador_id | text | Referencia a evaluador. |
| estado | text | Estado de la evaluacion humana. |
| puntaje_pertinencia | integer | Puntaje por criterio. |
| puntaje_innovacion | integer | Puntaje por criterio. |
| puntaje_metodologia | integer | Puntaje por criterio. |
| puntaje_impacto | integer | Puntaje por criterio. |
| puntaje_comunicacion | integer | Puntaje por criterio. |
| puntaje_total | integer | Suma total. |
| observaciones | text | Observaciones generales. |
| fortalezas | text | Fortalezas del proyecto. |
| oportunidades | text | Oportunidades de mejora. |
| recomendacion_final | text | Destacado, Aprobar, Ajustar o No recomendado. |
| concepto_evaluador | text | Concepto final humano. |
| fecha_envio | timestamptz | Fecha de envio. |

## Tabla `analisis_ia`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| analisis_id | text | ID unico. |
| codigo_proyecto | text | Referencia a proyecto. |
| archivo_storage_path | text | Archivo analizado en Supabase Storage. |
| estado | text | Pendiente, Procesando, Completado, Error o No disponible. |
| resumen_ia | text | Resumen generado por IA. |
| tendencias_identificadas | jsonb | Tendencias identificadas. |
| puntaje_sugerido_ia | integer | Puntaje sugerido por IA. |
| nivel_tendencia_ia | text | Bajo, Medio, Alto, Sobresaliente o No disponible. |
| concepto_ia | text | Concepto final IA. |
| alertas_calidad | jsonb | Alertas de calidad detectadas. |
| fecha_analisis | timestamptz | Fecha de analisis. |

## Tabla `certificados`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| certificado_id | text | ID unico. |
| tipo | text | Participante, Instructor o Evaluador. |
| nombre | text | Nombre para certificado. |
| documento | text | Documento interno si aplica. |
| codigo_proyecto | text | Proyecto asociado si aplica. |
| rol | text | Rol certificado. |
| fecha_evento | date | Fecha del evento. |
| estado | text | Pendiente, Generado o Enviado. |
| archivo_certificado_url | text | URL futura del certificado. |

## Storage

- Bucket: `project-files`.
- Acceso de evaluadores: signed URLs generadas desde rutas del servidor.
- Las tablas publicas nunca muestran correos, documentos ni celulares.
