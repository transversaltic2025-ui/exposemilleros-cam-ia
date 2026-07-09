import { z } from "zod";

import { callOpenRouter } from "@/lib/ai/openrouter";
import type { Project } from "@/types";

const scoreSchema = z.coerce
  .number()
  .catch(0)
  .transform((score) => Math.min(100, Math.max(0, Math.round(score))));
const stringSchema = z.preprocess(
  (value) => typeof value === "string" && value.trim() ? value.trim() : "Pendiente",
  z.string().catch("Pendiente"),
);
const stringArraySchema = z.preprocess(
  (value) => Array.isArray(value) ? value : [],
  z.array(z.string()).catch([]),
);

const analysisSchema = z.object({
  resumen_ia: stringSchema,
  tendencias_identificadas: stringArraySchema,
  palabras_clave_ia: stringArraySchema,
  sectores_relacionados: stringArraySchema,
  nivel_innovacion_ia: scoreSchema,
  nivel_pertinencia_ia: scoreSchema,
  nivel_impacto_ia: scoreSchema,
  nivel_viabilidad_ia: scoreSchema,
  nivel_claridad_metodologica_ia: scoreSchema,
  nivel_articulacion_tendencias_ia: scoreSchema,
  riesgos_detectados: stringArraySchema,
  oportunidades_detectadas: stringArraySchema,
  puntaje_sugerido_ia: scoreSchema,
  promedio_ia: scoreSchema,
  porcentaje_ia: scoreSchema,
  nivel_tendencia_ia: stringSchema,
  concepto_ia: stringSchema,
  enfoque_genero_ia: stringSchema,
  nivel_inclusion_genero_ia: scoreSchema,
  recomendaciones_genero_ia: stringArraySchema,
  enfoque_etnico_ia: stringSchema,
  nivel_inclusion_etnica_ia: scoreSchema,
  recomendaciones_etnicas_ia: stringArraySchema,
  enfoque_diferencial_ia: stringSchema,
  riesgos_exclusion_ia: stringArraySchema,
  oportunidades_inclusion_ia: stringArraySchema,
});

export type TrendAnalysisResult = z.infer<typeof analysisSchema> & {
  modelo_ia: string;
  estado_analisis: "Completado";
  mensaje_error: string;
};

function getNivelTendencia(porcentaje: number) {
  if (porcentaje <= 39) {
    return "Bajo nivel de tendencia";
  }
  if (porcentaje <= 59) {
    return "Tendencia emergente debil";
  }
  if (porcentaje <= 79) {
    return "Tendencia emergente relevante";
  }
  if (porcentaje <= 89) {
    return "Tendencia fuerte";
  }
  return "Proyecto altamente tendencial";
}

function extractJson(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return candidate.slice(first, last + 1);
  }

  throw new Error("No se pudo interpretar la respuesta JSON del modelo.");
}

function parseAnalysisJson(content: string) {
  try {
    const parsed = JSON.parse(extractJson(content));
    console.log("[ai/trend-analysis] parseo JSON exitoso");
    return parsed;
  } catch (error) {
    console.warn("[ai/trend-analysis] parseo JSON fallido");
    if (error instanceof Error && error.message === "No se pudo interpretar la respuesta JSON del modelo.") {
      throw error;
    }
    throw new Error("No se pudo interpretar la respuesta JSON del modelo.");
  }
}

function projectValue(project: Project, key: keyof Project) {
  const value = project[key];
  return typeof value === "string" && value.trim() ? value.trim() : "No registrado";
}

function projectList(project: Project, key: keyof Project) {
  const value = project[key];
  return Array.isArray(value) && value.length > 0
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).join(", ")
    : "No registrado";
}

function cleanStringArray(values: unknown) {
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
}

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "Pendiente";
}

function cleanScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : 0;
}

export async function analyzeProjectTrends(project: Project): Promise<TrendAnalysisResult> {
  const systemPrompt = [
    "Eres un analista tecnico para ExpoSemilleros CAM IA.",
    "Analiza tendencias de proyectos de semilleros con enfoque institucional, regional, academico y productivo.",
    "Tambien evalua enfoque de genero, inclusion de grupos etnicos, comunidades rurales, campesinas o vulnerables, enfoque diferencial, riesgos de exclusion y oportunidades de inclusion.",
    "Regla etica obligatoria: no infieras genero, etnia, raza, identidad o pertenencia poblacional por nombre, apellido, municipio, institucion o apariencia.",
    "Solo evalua enfoque poblacional cuando el proyecto mencione explicitamente participacion, beneficios, acciones o enfoque para mujeres, comunidades indigenas, afrodescendientes, raizales, palenqueras, Rrom, campesinas, rurales, victimas, poblacion con discapacidad u otros grupos poblacionales.",
    "Por ahora solo puedes usar metadatos y descripcion del proyecto. No afirmes que leiste archivos PDF o DOCX.",
    "Devuelve exclusivamente JSON valido, sin markdown, sin comentarios y sin texto adicional.",
    "Todos los puntajes deben estar entre 0 y 100.",
  ].join(" ");

  const userPrompt = `Analiza este proyecto y responde estrictamente con JSON usando esta estructura exacta:
{
  "resumen_ia": "",
  "tendencias_identificadas": [],
  "palabras_clave_ia": [],
  "sectores_relacionados": [],
  "nivel_innovacion_ia": 0,
  "nivel_pertinencia_ia": 0,
  "nivel_impacto_ia": 0,
  "nivel_viabilidad_ia": 0,
  "nivel_claridad_metodologica_ia": 0,
  "nivel_articulacion_tendencias_ia": 0,
  "riesgos_detectados": [],
  "oportunidades_detectadas": [],
  "puntaje_sugerido_ia": 0,
  "promedio_ia": 0,
  "porcentaje_ia": 0,
  "nivel_tendencia_ia": "",
  "concepto_ia": "",
  "enfoque_genero_ia": "",
  "nivel_inclusion_genero_ia": 0,
  "recomendaciones_genero_ia": [],
  "enfoque_etnico_ia": "",
  "nivel_inclusion_etnica_ia": 0,
  "recomendaciones_etnicas_ia": [],
  "enfoque_diferencial_ia": "",
  "riesgos_exclusion_ia": [],
  "oportunidades_inclusion_ia": []
}

Calcula nivel_tendencia_ia asi:
0 a 39: Bajo nivel de tendencia
40 a 59: Tendencia emergente debil
60 a 79: Tendencia emergente relevante
80 a 89: Tendencia fuerte
90 a 100: Proyecto altamente tendencial

Instrucciones para inclusion, genero y enfoque diferencial:
- enfoque_genero_ia: texto corto indicando si el proyecto incluye, menciona o ignora enfoque de genero. Si no hay evidencia, escribe exactamente "No se evidencia un enfoque de género explícito en la información suministrada."
- nivel_inclusion_genero_ia: puntaje 0 a 100. 0 a 39 sin enfoque claro, 40 a 59 enfoque incipiente, 60 a 79 enfoque aceptable, 80 a 100 enfoque solido.
- recomendaciones_genero_ia: recomendaciones practicas para mejorar inclusion de genero.
- enfoque_etnico_ia: texto corto indicando si el proyecto incluye, menciona o ignora comunidades etnicas. Si no hay evidencia, escribe exactamente "No se evidencia un enfoque étnico explícito en la información suministrada."
- nivel_inclusion_etnica_ia: puntaje 0 a 100. 0 a 39 sin enfoque claro, 40 a 59 enfoque incipiente, 60 a 79 enfoque aceptable, 80 a 100 enfoque solido.
- recomendaciones_etnicas_ia: recomendaciones practicas para incluir comunidades indigenas, afrodescendientes, raizales, palenqueras, Rrom o comunidades locales cuando aplique.
- enfoque_diferencial_ia: analiza si el proyecto reconoce diferencias por territorio, ruralidad, discapacidad, edad, genero, pertenencia etnica, poblacion victima u otras condiciones.
- riesgos_exclusion_ia: lista posibles riesgos de exclusion del proyecto.
- oportunidades_inclusion_ia: lista oportunidades para que el proyecto sea mas incluyente.
- Si no hay evidencia explicita, no inventes poblaciones beneficiarias ni caracteristicas de participantes.

Datos del proyecto:
- Nombre: ${projectValue(project, "nombre_proyecto") || projectValue(project, "titulo")}
- Linea tematica: ${projectValue(project, "linea_tematica")}
- Otra linea tematica: ${projectValue(project, "linea_tematica_otro")}
- Resumen cientifico - Problema: ${projectValue(project, "resumen_problema")}
- Resumen cientifico - Objetivo: ${projectValue(project, "resumen_objetivo")}
- Resumen cientifico - Metodologia: ${projectValue(project, "resumen_metodologia")}
- Resumen cientifico - Resultados: ${projectValue(project, "resumen_resultados")}
- Resumen cientifico - Conclusiones: ${projectValue(project, "resumen_conclusiones")}
- Modalidades: ${projectList(project, "modalidades_proyecto")}
- Modalidad de participacion legacy: ${projectValue(project, "modalidad_participacion")}
- Otra modalidad: ${projectValue(project, "modalidad_otro")}
- Estado del proyecto: ${projectValue(project, "estado_desarrollo_proyecto")}
- Productos obtenidos: ${projectList(project, "productos_obtenidos")}
- Otro producto obtenido: ${projectValue(project, "productos_obtenidos_otro")}
- Nivel de madurez: ${projectValue(project, "nivel_madurez")}
- Semillero: ${projectValue(project, "semillero")}
- Otro semillero: ${projectValue(project, "semillero_otro")}
- Institucion: ${projectValue(project, "institucion")}
- Municipio: ${projectValue(project, "municipio")}
- Categoria de presentacion: ${projectValue(project, "categoria_presentacion")}
- Observaciones adicionales: ${projectValue(project, "observaciones_adicionales") || projectValue(project, "resumen")}`;

  const response = await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const parsed = parseAnalysisJson(response.content);

  const analysis = analysisSchema.parse(parsed);
  const rubricScores = [
    analysis.nivel_innovacion_ia,
    analysis.nivel_pertinencia_ia,
    analysis.nivel_impacto_ia,
    analysis.nivel_viabilidad_ia,
    analysis.nivel_claridad_metodologica_ia,
    analysis.nivel_articulacion_tendencias_ia,
  ];
  const promedio = Math.round(
    rubricScores.reduce((sum, score) => sum + score, 0) / rubricScores.length,
  );
  const porcentaje = Math.round(analysis.porcentaje_ia || analysis.puntaje_sugerido_ia || promedio);

  return {
    ...analysis,
    resumen_ia: cleanText(analysis.resumen_ia),
    tendencias_identificadas: cleanStringArray(analysis.tendencias_identificadas),
    palabras_clave_ia: cleanStringArray(analysis.palabras_clave_ia),
    sectores_relacionados: cleanStringArray(analysis.sectores_relacionados),
    nivel_innovacion_ia: cleanScore(analysis.nivel_innovacion_ia),
    nivel_pertinencia_ia: cleanScore(analysis.nivel_pertinencia_ia),
    nivel_impacto_ia: cleanScore(analysis.nivel_impacto_ia),
    nivel_viabilidad_ia: cleanScore(analysis.nivel_viabilidad_ia),
    nivel_claridad_metodologica_ia: cleanScore(analysis.nivel_claridad_metodologica_ia),
    nivel_articulacion_tendencias_ia: cleanScore(analysis.nivel_articulacion_tendencias_ia),
    riesgos_detectados: cleanStringArray(analysis.riesgos_detectados),
    oportunidades_detectadas: cleanStringArray(analysis.oportunidades_detectadas),
    enfoque_genero_ia:
      analysis.enfoque_genero_ia ||
      "No se evidencia un enfoque de género explícito en la información suministrada.",
    nivel_inclusion_genero_ia: cleanScore(analysis.nivel_inclusion_genero_ia),
    recomendaciones_genero_ia: cleanStringArray(analysis.recomendaciones_genero_ia),
    enfoque_etnico_ia:
      analysis.enfoque_etnico_ia ||
      "No se evidencia un enfoque étnico explícito en la información suministrada.",
    nivel_inclusion_etnica_ia: cleanScore(analysis.nivel_inclusion_etnica_ia),
    recomendaciones_etnicas_ia: cleanStringArray(analysis.recomendaciones_etnicas_ia),
    enfoque_diferencial_ia: cleanText(analysis.enfoque_diferencial_ia),
    riesgos_exclusion_ia: cleanStringArray(analysis.riesgos_exclusion_ia),
    oportunidades_inclusion_ia: cleanStringArray(analysis.oportunidades_inclusion_ia),
    promedio_ia: promedio,
    porcentaje_ia: Math.min(100, Math.max(0, porcentaje)),
    puntaje_sugerido_ia: Math.min(100, Math.max(0, Math.round(analysis.puntaje_sugerido_ia || promedio))),
    nivel_tendencia_ia: getNivelTendencia(Math.min(100, Math.max(0, porcentaje))),
    concepto_ia: cleanText(analysis.concepto_ia),
    modelo_ia: response.modelUsed,
    estado_analisis: "Completado",
    mensaje_error: "",
  };
}

