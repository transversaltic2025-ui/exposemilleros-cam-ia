# ExpoSemilleros CAM IA - Contrato API inicial

Esta version define contratos para APIs Next.js que despues actuaran como puente hacia Google Apps Script. Por ahora las paginas usan datos mock.

## Convenciones

- Base interna Next.js: `/api`.
- Payloads JSON salvo carga de archivo, que usara `multipart/form-data`.
- Las respuestas exitosas incluyen `ok: true`.
- Los errores incluyen `ok: false`, `code` y `message`.
- No se expone correo, documento ni celular desde endpoints publicos.

## `POST /api/proyectos`

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
  "ok": true,
  "codigo": "CAM-2026-001",
  "estado": "recibido"
}
```

## `GET /api/proyectos`

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

## `GET /api/proyectos/:codigo`

Obtiene ficha publica del proyecto.

## `POST /api/evaluadores`

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
  "ok": true,
  "evaluador_id": "EVAL-001",
  "estado": "disponible"
}
```

## `POST /api/asignaciones/auto`

Ejecuta asignacion automatica.

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

## `GET /api/evaluaciones/:token`

Obtiene informacion de evaluacion por token. Debe devolver lo necesario para evaluar, sin credenciales.

## `POST /api/evaluaciones/:token`

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
  "recomendacion_final": "destacado",
  "concepto_evaluador": "Recomendado por su impacto potencial."
}
```

## `POST /api/ia/analizar/:codigo`

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

## `GET /api/tendencias`

Entrega agregados para dashboard con Recharts.

## `GET /api/admin/logistica`

Entrega agregados internos: proyectos, evaluadores, asignaciones, evaluaciones, certificados pendientes y distribucion por area.
