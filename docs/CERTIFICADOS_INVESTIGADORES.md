# Certificados de investigadores asociados

El tipo interno y el rol visible son `Investigador`. Se consultan directamente
`proyecto_integrantes.nombre_completo`, `documento` y `proyecto_id` para los roles
`Investigador asociado`, `Investigador`, `Investigador/a asociado/a` e
`Investigador asociado/a`. El proyecto se conserva mediante `proyecto_id`.

| Rol de origen | Tipo / rol del PDF |
| --- | --- |
| Autor principal, Aprendiz participante | Ponente |
| Instructor, Líder, Líder de proyecto, Instructor líder | Líder de proyecto |
| Investigador asociado y variantes indicadas | Investigador |
| Evaluador de proyectos con evaluación | Evaluador |
| Evaluador de productores campesinos con evaluación | Tipo: Evaluador productores campesinos; PDF: Evaluador |

La generación mantiene la deduplicación por documento, tipo y proyecto. La
regeneración actualiza el registro y reutiliza su ruta válida en Storage.
Los PDF se guardan bajo `certificados/investigadores/`, con nombre sanitizado
y el sufijo de archivo utilizado por el generador común.

Se puede configurar una plantilla de tipo `Investigador`; si no existe una
activa, se usa `General`, con sus posiciones actuales. El PDF solo añade nombre,
documento y el rol `Investigador`.

- Generación: `POST /api/admin/certificados/generar` con
  `{"tipo":"investigadores","regenerate":false,"offset":0,"limit":25}`.
- Regeneración: la misma solicitud con `regenerate: true`.
- `tipo: "todos"` incluye investigadores; también el botón de regenerar todos.
- Vista previa: `/api/admin/certificates/templates/preview?tipo=Investigador`.
- ZIP: `/api/admin/certificados/package?tipo=investigador&offset=0&limit=30`.

El KPI Investigadores cuenta personas únicas por documento (nombre si falta
documento) entre las cuatro variantes admitidas. Una persona en varios proyectos
cuenta una vez en el KPI y puede recibir un certificado por proyecto.

Validación local: `node scripts/test-certificates.cjs` y `npm.cmd run build`.
Las pruebas de regresión simulan Supabase, Storage y la generación PDF.
