import { z } from "zod";

import { callOpenRouter, type OpenRouterContentPart } from "@/lib/ai/openrouter";
import { toText, toTextArray } from "@/lib/ai/analysis-normalization";
import type { Project } from "@/types";

const score = z.coerce.number().catch(0).transform((v) => Math.min(100, Math.max(0, Math.round(v))));
const text = z.preprocess((v) => toText(v) || "No reportado explícitamente", z.string());
const list = z.preprocess(toTextArray, z.array(z.string()));

const analysisSchema = z.object({
  resumen_ia: text, tendencias_identificadas: list, palabras_clave_ia: list, sectores_relacionados: list,
  nivel_innovacion_ia: score, nivel_pertinencia_ia: score, nivel_impacto_ia: score, nivel_viabilidad_ia: score,
  nivel_claridad_metodologica_ia: score, nivel_articulacion_tendencias_ia: score, riesgos_detectados: list,
  oportunidades_detectadas: list, puntaje_sugerido_ia: score, promedio_ia: score, porcentaje_ia: score,
  nivel_tendencia_ia: text, concepto_ia: text, enfoque_genero_ia: text, nivel_inclusion_genero_ia: score,
  mujeres_involucradas_ia: text, mujeres_en_formulacion_ia: text, mujeres_en_ejecucion_ia: text,
  evidencia_genero_ia: text, brechas_genero_ia: list, acciones_genero_recomendadas_ia: list,
  recomendaciones_genero_ia: text, enfoque_etnico_ia: text, nivel_inclusion_etnica_ia: score,
  recomendaciones_etnicas_ia: text, enfoque_diferencial_ia: text, riesgos_exclusion_ia: list,
  oportunidades_inclusion_ia: list,
});

export type TrendAnalysisResult = z.infer<typeof analysisSchema> & {
  modelo_ia: string; estado_analisis: "Completado"; mensaje_error: string;
};

export type AnalysisFile = { filename: string; mimeType: string; bytes: ArrayBuffer };

function value(project: Project, key: keyof Project) {
  const current = project[key];
  return typeof current === "string" && current.trim() ? current.trim() : "No registrado";
}

function values(project: Project, key: keyof Project) {
  const current = project[key];
  return Array.isArray(current) && current.length ? current.join(", ") : "No registrado";
}

function extractJson(content: string) {
  const candidate = content.trim().match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ?? content.trim();
  const first = candidate.indexOf("{"); const last = candidate.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error(`No se pudo interpretar la respuesta JSON del modelo. Extracto: ${content.replace(/\s+/g, " ").trim().slice(0, 500) || "Respuesta vacía"}`);
  const json = candidate.slice(first, last + 1);
  try {
    return JSON.parse(json);
  } catch {
    const excerpt = content.replace(/\s+/g, " ").trim().slice(0, 500);
    throw new Error(`No se pudo interpretar la respuesta JSON del modelo. Extracto: ${excerpt || "Respuesta vacía"}`);
  }
}

function trendLevel(percent: number) {
  if (percent <= 39) return "Bajo nivel de tendencia";
  if (percent <= 59) return "Tendencia emergente débil";
  if (percent <= 79) return "Tendencia emergente relevante";
  if (percent <= 89) return "Tendencia fuerte";
  return "Proyecto altamente tendencial";
}

export async function analyzeProjectTrends(project: Project, file?: AnalysisFile, signal?: AbortSignal): Promise<TrendAnalysisResult> {
  const system = "Eres analista técnico de ExpoSemilleros CAM IA. Lee el archivo adjunto y los datos registrados. Devuelve exclusivamente JSON válido. Analiza el enfoque de género únicamente con información explícita. No infieras género por nombres propios, apellidos, apariencia, municipio o institución. Identifica menciones explícitas a mujeres como beneficiarias, integrantes, formuladoras, ejecutoras, lideresas, aprendices, instructoras, productoras, emprendedoras o participantes. Si no hay evidencia explícita en formulación o ejecución, responde exactamente 'No reportado explícitamente'. Todos los puntajes deben estar entre 0 y 100. Los campos de tipo lista deben ser siempre arrays JSON, incluso si solo contienen un elemento; nunca devuelvas texto plano en esos campos.";
  const members = (project.equipo ?? []).map((member) => ({ rol_integrante: member.rol_integrante }));
  const prompt = `Analiza el proyecto y responde con esta estructura JSON exacta:
{"resumen_ia":"","tendencias_identificadas":[],"palabras_clave_ia":[],"sectores_relacionados":[],"nivel_innovacion_ia":0,"nivel_pertinencia_ia":0,"nivel_impacto_ia":0,"nivel_viabilidad_ia":0,"nivel_claridad_metodologica_ia":0,"nivel_articulacion_tendencias_ia":0,"riesgos_detectados":[],"oportunidades_detectadas":[],"puntaje_sugerido_ia":0,"promedio_ia":0,"porcentaje_ia":0,"nivel_tendencia_ia":"","concepto_ia":"","enfoque_genero_ia":"","nivel_inclusion_genero_ia":0,"mujeres_involucradas_ia":"","mujeres_en_formulacion_ia":"","mujeres_en_ejecucion_ia":"","evidencia_genero_ia":"","brechas_genero_ia":[],"acciones_genero_recomendadas_ia":[],"recomendaciones_genero_ia":"","enfoque_etnico_ia":"","nivel_inclusion_etnica_ia":0,"recomendaciones_etnicas_ia":"","enfoque_diferencial_ia":"","riesgos_exclusion_ia":[],"oportunidades_inclusion_ia":[]}
Los nueve campos de lista deben conservar los corchetes aunque tengan un solo elemento. Ejemplo correcto: "acciones_genero_recomendadas_ia":["Fortalecer la documentación explícita de la participación de mujeres en la formulación.","Identificar roles de mujeres en la ejecución del proyecto."]. Ejemplo incorrecto: "acciones_genero_recomendadas_ia":"Fortalecer la documentación explícita de la participación de mujeres.".
Datos: ${JSON.stringify({ nombre_proyecto: value(project,"nombre_proyecto"), linea_tematica: value(project,"linea_tematica"), semillero: value(project,"semillero"), municipio: value(project,"municipio"), resumen_problema: value(project,"resumen_problema"), resumen_objetivo: value(project,"resumen_objetivo"), resumen_metodologia: value(project,"resumen_metodologia"), resumen_resultados: value(project,"resumen_resultados"), resumen_conclusiones: value(project,"resumen_conclusiones"), productos_obtenidos: values(project,"productos_obtenidos"), nivel_madurez: value(project,"nivel_madurez"), roles_integrantes: members })}
Los nombres de integrantes solo permiten reconocer roles; nunca permiten inferir género. Sustenta evidencia_genero_ia con texto explícito del proyecto.`;
  const content: OpenRouterContentPart[] = [{ type: "text", text: prompt }];
  if (file) content.push({ type: "file", file: { filename: file.filename, file_data: `data:${file.mimeType};base64,${Buffer.from(file.bytes).toString("base64")}` } });
  const response = await callOpenRouter([{ role: "system", content: system }, { role: "user", content }], { signal });
  const parsed = analysisSchema.parse(extractJson(response.content));
  const rubric = [parsed.nivel_innovacion_ia, parsed.nivel_pertinencia_ia, parsed.nivel_impacto_ia, parsed.nivel_viabilidad_ia, parsed.nivel_claridad_metodologica_ia, parsed.nivel_articulacion_tendencias_ia];
  const average = Math.round(rubric.reduce((sum, item) => sum + item, 0) / rubric.length);
  const percentage = Math.min(100, Math.max(0, parsed.porcentaje_ia || parsed.puntaje_sugerido_ia || average));
  return { ...parsed, promedio_ia: average, porcentaje_ia: percentage, puntaje_sugerido_ia: parsed.puntaje_sugerido_ia || average, nivel_tendencia_ia: trendLevel(percentage), modelo_ia: response.modelUsed, estado_analisis: "Completado", mensaje_error: "" };
}
