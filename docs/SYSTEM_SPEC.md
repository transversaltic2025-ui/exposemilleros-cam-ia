# ExpoSemilleros CAM IA - Especificacion del sistema

## Proposito

ExpoSemilleros CAM IA es el sistema web del Encuentro de Semilleros de Investigacion CAM 2026 - ExpoInnovacion y CampeSENA. Centraliza inscripcion de proyectos, registro de evaluadores, asignacion por area de conocimiento, evaluacion humana por token, analisis IA de archivos y tableros para tendencias, logistica y certificados.

## Alcance inicial

- Capturar proyectos desde `/inscripcion` sin Google Forms.
- Recibir archivos de proyecto desde el sistema y almacenarlos posteriormente en Google Drive.
- Guardar registros estructurados en Google Sheets mediante Google Apps Script.
- Registrar evaluadores desde `/evaluadores/registro`, sin login ni contrasena.
- Asignar proyectos por area de conocimiento con maximo 3 proyectos por evaluador y maximo 2 evaluadores por proyecto.
- Entregar enlaces de evaluacion por token.
- Registrar puntajes, observaciones, fortalezas, oportunidades, recomendacion final y `concepto_evaluador`.
- Preparar analisis IA del archivo con `resumen_ia`, `tendencias_identificadas`, `puntaje_sugerido_ia`, `nivel_tendencia_ia` y `concepto_ia`.
- Comparar evaluacion humana contra concepto IA.
- Mostrar dashboards de tendencias y logistica.
- Preparar datos para certificados de participantes, instructores y evaluadores.

## Fuera de alcance por ahora

- Conexion real con Google Sheets.
- Conexion real con Google Drive.
- Ejecucion real de IA sobre documentos.
- Envio real de correos o WhatsApp.
- Login tradicional o sistema de usuarios con contrasena.

## Arquitectura objetivo

```text
Next.js App Router
  -> API Routes Next.js
  -> Google Apps Script Web App
  -> Google Sheets + Google Drive
  -> Analisis IA de archivos
  -> Dashboard + certificados
```

## Capas del proyecto

- `/app`: rutas, paginas y componentes de ruta.
- `/components`: componentes reutilizables y shadcn/ui.
- `/lib`: datos mock, reglas de negocio, clientes futuros de Apps Script, helpers.
- `/types`: tipos compartidos del dominio.
- `/docs`: especificaciones funcionales, contratos y prompts.

## Rutas

| Ruta | Uso |
| --- | --- |
| `/` | Inicio operativo del evento y accesos principales. |
| `/inscripcion` | Formulario de inscripcion de proyectos. |
| `/inscripcion/gracias` | Confirmacion de proyecto recibido. |
| `/evaluadores/registro` | Registro de evaluadores. |
| `/evaluadores/gracias` | Confirmacion de evaluador registrado. |
| `/proyectos` | Listado publico de proyectos sin datos sensibles. |
| `/proyectos/[codigo]` | Ficha publica del proyecto. |
| `/evaluar/[token]` | Evaluacion humana por enlace tokenizado. |
| `/tendencias` | Dashboard publico de tendencias agregadas. |
| `/admin` | Resumen interno de operacion. |
| `/admin/evaluadores` | Gestion mock de evaluadores. |
| `/admin/asignaciones` | Revision mock de asignaciones. |
| `/admin/certificados` | Preparacion mock de certificados. |

## Privacidad

Las tablas publicas no deben mostrar correos, documentos ni celulares. Esos datos solo se usan internamente para operacion, certificados y contacto del evento.

## Estado actual

La primera version usa datos mock locales. Las integraciones externas se implementaran despues mediante contratos definidos en `docs/API_CONTRACT.md`.
