# ExpoSemilleros CAM IA - Contrato API inicial

Esta version define contratos para APIs Next.js conectadas a Supabase Database y Supabase Storage. Los datos mock solo se usan cuando `USE_MOCK_DATA=true`.

## Convenciones

- Base interna Next.js: `/api`.
- Payloads JSON salvo carga de archivo, que usara `multipart/form-data`.
- Las respuestas exitosas incluyen `ok: true`.
- Los errores incluyen `ok: false`, `code` y `message`.
- No se expone correo, documento ni celular desde endpoints publicos.

## `POST /api/projects/register`

Registra un proyecto y sube su archivo.

Content-Type: `multipart/form-data`

Campos:

- `titulo`
- `resumen`
- `area_conocimiento`
- `linea_investigacion`
- `institucion`
- `municipio`
- `integrantes`
- `documentos_integrantes`
- `instructor_nombre`
- `instructor_correo`
- `instructor_celular`
- `archivo`

Respuesta:

```json
{
  "project": {
    "codigo": "CAM-2026-001",
    "estado": "Registrado"
  }
}
```

## Lectura de proyectos

Lista proyectos publicos sin datos sensibles.

Respuesta:

```json
{
  "ok": true,
  "data": [
    {
      "codigo": "CAM-2026-001",
      "titulo": "Sistema de riego inteligente",
      "area_conocimiento": "Agroindustria",
      "municipio": "Pitalito",
      "estado": "asignado"
    }
  ]
}
```

Las paginas `/proyectos` y `/proyectos/[codigo]` leen desde `lib/supabase/queries.ts`. Los datos publicos no incluyen correos, documentos ni celulares.

## `POST /api/evaluators/register`

Registra evaluador.

Payload:

```json
{
  "nombre": "Nombre Evaluador",
  "correo": "evaluador@example.com",
  "celular": "3000000000",
  "documento": "1000000000",
  "entidad": "SENA",
  "area_conocimiento": "Agroindustria",
  "disponibilidad": "Manana"
}
```

Respuesta:

```json
{
  "evaluador": {
    "evaluador_id": "EVAL-001",
    "estado": "Disponible"
  },
  "assignments": []
}
```

## Asignacion automatica

La asignacion automatica se ejecuta al registrar evaluadores desde `/api/evaluators/register`.

Reglas:

- Evaluador: maximo 3 proyectos.
- Proyecto: maximo 2 evaluadores.
- Area de conocimiento debe coincidir.
- No duplicar evaluador para el mismo proyecto.

Respuesta:

```json
{
  "ok": true,
  "asignaciones_creadas": 6,
  "pendientes_por_area": []
}
```

## Lectura de evaluacion por token

La pagina `/evaluar/[token]` lee la asignacion desde Supabase y genera un signed URL del archivo en `project-files`.

## `POST /api/evaluations/:token`

Registra evaluacion humana.

Payload:

```json
{
  "archivo_abierto": true,
  "puntaje_pertinencia": 18,
  "puntaje_innovacion": 17,
  "puntaje_metodologia": 16,
  "puntaje_impacto": 18,
  "puntaje_comunicacion": 17,
  "observaciones": "Proyecto claro y pertinente.",
  "fortalezas": "Alta pertinencia regional.",
  "oportunidades": "Fortalecer validacion con usuarios.",
  "recomendacion_final": "Destacado",
  "concepto_evaluador": "Recomendado por su impacto potencial."
}
```

## Analisis IA

No conectado todavia. La tabla `analisis_ia` queda preparada para almacenar resultados futuros.

Ejemplo futuro:

Dispara analisis IA del archivo asociado al proyecto.

Respuesta:

```json
{
  "ok": true,
  "resumen_ia": "Resumen del documento.",
  "tendencias_identificadas": ["Agrotech", "Sostenibilidad"],
  "puntaje_sugerido_ia": 86,
  "nivel_tendencia_ia": "alto",
  "concepto_ia": "Proyecto con alta alineacion a retos regionales."
}
```

## Tendencias

La pagina `/tendencias` entrega agregados para dashboard con Recharts desde consultas centralizadas.

## Logistica admin

La pagina `/admin` entrega agregados internos: proyectos, evaluadores, asignaciones, evaluaciones, certificados pendientes y distribucion por area.
