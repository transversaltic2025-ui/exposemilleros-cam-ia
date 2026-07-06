# ExpoSemilleros CAM IA

Sistema web para el Encuentro de Semilleros de Investigacion CAM 2026 - ExpoInnovacion y CampeSENA.

## Reglas obligatorias

- El sistema se llama ExpoSemilleros CAM IA.
- Nombre corto de interfaz: ExpoSemilleros IA.
- No crear login tradicional.
- No crear sistema de usuarios con contrasena.
- No usar formularios externos para la inscripcion.
- La inscripcion de proyectos se hace desde `/inscripcion`.
- El registro de evaluadores se hace desde `/evaluadores/registro`.
- Los proyectos se guardan en Supabase Database.
- Los archivos de proyectos se guardan en Supabase Storage.
- Los evaluadores no inician sesion, se registran y reciben enlaces de evaluacion por token.
- Cada evaluador puede tener maximo 3 proyectos asignados.
- Cada proyecto puede tener maximo 2 evaluadores.
- La asignacion de proyectos debe coincidir con el area de conocimiento del evaluador.
- El evaluador debe abrir y leer el archivo del proyecto.
- La evaluacion humana debe generar puntajes, observaciones, fortalezas, oportunidades, recomendacion final y `concepto_evaluador`.
- La IA debe leer el archivo del proyecto y generar `resumen_ia`, `tendencias_identificadas`, `puntaje_sugerido_ia`, `nivel_tendencia_ia` y `concepto_ia`.
- El sistema debe comparar evaluacion humana vs analisis IA.
- El dashboard debe incluir analisis de tendencias y logistica del evento.
- El sistema debe guardar datos para certificados de participantes, instructores y evaluadores.
- No mostrar correos, documentos ni celulares en tablas publicas.
- Usar Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod y Recharts.
- Separar logica en `/lib`.
- Separar tipos en `/types`.
- Separar documentacion en `/docs`.
- Mantener diseno institucional, moderno, limpio y responsive.

## Rutas principales

- `/`
- `/inscripcion`
- `/inscripcion/gracias`
- `/evaluadores/registro`
- `/evaluadores/gracias`
- `/proyectos`
- `/proyectos/[codigo]`
- `/evaluar/[token]`
- `/tendencias`
- `/admin`
- `/admin/evaluadores`
- `/admin/asignaciones`
- `/admin/certificados`

## Flujo principal

Sistema web -> API Next.js -> Supabase Database + Supabase Storage -> Evaluacion humana -> Analisis IA -> Dashboard -> Certificados.
