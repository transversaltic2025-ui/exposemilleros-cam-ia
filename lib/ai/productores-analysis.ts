import { z } from "zod";
import { callOpenRouter } from "./openrouter";
import type { ProductorIniciativa } from "@/types/productores";

const text = z.preprocess(value => typeof value === "string" && value.trim() ? value.trim() : "Pendiente", z.string());
const list = z.preprocess(value => Array.isArray(value) ? value.filter(item => typeof item === "string" && item.trim()).map(item => item.trim()) : [], z.array(z.string()));
const number = (maximum: number) => z.preprocess(value => typeof value === "number" && Number.isFinite(value) ? value : 0, z.number()).transform(value => Math.min(maximum, Math.max(0, Math.round(value * 100) / 100)));
const schema = z.object({
  resumen_ia: text, linea_productiva_detectada: text, nivel_madurez_ia: text,
  potencial_comercial_ia: text, riesgos_detectados: list, oportunidades_detectadas: list,
  necesidades_fortalecimiento: list, recomendaciones_ia: list, tendencias_relacionadas: list,
  prioridad_acompanamiento: text, puntaje_sugerido_ia: number(25), porcentaje_ia: number(100),
  nivel_tendencia_ia: z.preprocess(value => typeof value === "string" ? value.trim() : "", z.string()),
});

export function extractProductoresJson(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("La IA respondió, pero no entregó un JSON válido.");
  try { return JSON.parse(candidate.slice(first, last + 1)) as unknown; }
  catch { throw new Error("La IA respondió, pero no entregó un JSON válido."); }
}

function parse(content: string) {
  try {
    const result = schema.parse(extractProductoresJson(content));
    const nivel = result.nivel_tendencia_ia || (result.porcentaje_ia >= 80 ? "Alto potencial" : result.porcentaje_ia >= 60 ? "Potencial medio" : "Requiere fortalecimiento");
    return { ...result, nivel_tendencia_ia: nivel };
  } catch (error) {
    console.warn("[productores-ai] respuesta no interpretable", error instanceof Error ? error.message : "error desconocido");
    throw new Error("La IA respondió, pero no entregó un JSON válido.");
  }
}

export type ProductoresAnalysis = z.infer<typeof schema> & { modelo_ia: string };

export async function analyzeProductor(initiative: ProductorIniciativa): Promise<ProductoresAnalysis> {
  const prompt = `Analiza esta iniciativa productiva campesina. Responde estrictamente con un único JSON válido, sin markdown ni texto adicional, usando exactamente esta estructura:
{
"resumen_ia":"string",
"linea_productiva_detectada":"string",
"nivel_madurez_ia":"string",
"potencial_comercial_ia":"string",
"riesgos_detectados":["string"],
"oportunidades_detectadas":["string"],
"necesidades_fortalecimiento":["string"],
"recomendaciones_ia":["string"],
"tendencias_relacionadas":["string"],
"prioridad_acompanamiento":"Alta | Media | Baja",
"puntaje_sugerido_ia":0,
"porcentaje_ia":0,
"nivel_tendencia_ia":"Alto potencial | Potencial medio | Requiere fortalecimiento"
}
puntaje_sugerido_ia debe estar entre 0 y 25 y porcentaje_ia entre 0 y 100.
Datos: ${JSON.stringify({ nombre: initiative.nombre_iniciativa, linea: initiative.linea_productiva, descripcion: initiative.descripcion_iniciativa, producto: initiative.producto_servicio, anio: initiative.anio_inicio, madurez: initiative.nivel_madurez, productos: initiative.productos_obtenidos, ventas: initiative.donde_vende, dificultades: initiative.principal_dificultad, municipio: initiative.municipio, vereda: initiative.vereda?.trim() || "No registrada" })}`;
  let parsed: z.infer<typeof schema> | null = null;
  const response = await callOpenRouter([
    { role: "system", content: "Eres especialista en desarrollo rural colombiano. No inventes datos. Devuelve solo JSON válido." },
    { role: "user", content: prompt },
  ], {
    temperature: 0.2,
    validateContent: content => { parsed = parse(content); },
    onModelAttempt: model => console.log("[productores-ai] intentando modelo", model),
    onModelError: (model, error) => console.error("[productores-ai] modelo falló", model, error.message),
  });
  return { ...(parsed ?? parse(response.content)), modelo_ia: response.modelUsed };
}
