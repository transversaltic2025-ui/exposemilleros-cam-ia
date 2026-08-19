export const ANALYSIS_ARRAY_FIELDS = [
  "tendencias_identificadas", "palabras_clave_ia", "sectores_relacionados", "riesgos_detectados",
  "oportunidades_detectadas", "brechas_genero_ia", "acciones_genero_recomendadas_ia",
  "recomendaciones_genero_ia", "recomendaciones_etnicas_ia", "riesgos_exclusion_ia",
  "oportunidades_inclusion_ia",
] as const;

const TEXT_FIELDS = [
  "resumen_ia", "nivel_tendencia_ia", "concepto_ia", "enfoque_genero_ia",
  "mujeres_involucradas_ia", "mujeres_en_formulacion_ia", "mujeres_en_ejecucion_ia",
  "evidencia_genero_ia", "enfoque_etnico_ia", "enfoque_diferencial_ia",
  "estado_analisis", "mensaje_error", "modelo_ia",
] as const;

const NUMBER_FIELDS = [
  "nivel_innovacion_ia", "nivel_pertinencia_ia", "nivel_impacto_ia", "nivel_viabilidad_ia",
  "nivel_claridad_metodologica_ia", "nivel_articulacion_tendencias_ia",
  "nivel_inclusion_genero_ia", "nivel_inclusion_etnica_ia", "puntaje_sugerido_ia",
  "promedio_ia", "porcentaje_ia",
] as const;

function arrayItemToText(item: unknown): string {
  if (item === null || item === undefined) return "";
  if (typeof item !== "object") return String(item).trim();
  const object = item as Record<string, unknown>;
  for (const key of ["texto", "descripcion", "valor"] as const) {
    if (object[key] !== null && object[key] !== undefined) return String(object[key]).trim();
  }
  try { return JSON.stringify(item); } catch { return ""; }
}

export function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(arrayItemToText).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (typeof value === "object" && value !== null) {
    try { return [JSON.stringify(value)]; } catch { return []; }
  }
  return [];
}

export function toText(value: unknown): string {
  if (Array.isArray(value)) return value.map(arrayItemToText).filter(Boolean).join("; ");
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try { return JSON.stringify(value); } catch { return ""; }
  }
  return String(value).trim();
}

export function toNumber(value: unknown): number {
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) ? result : 0;
}

/** Creates the only payload shape allowed to be written to analisis_ia. */
export function normalizeAnalysisForDatabase(payload: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const field of ANALYSIS_ARRAY_FIELDS) if (field in payload) normalized[field] = toTextArray(payload[field]);
  for (const field of TEXT_FIELDS) if (field in payload) normalized[field] = toText(payload[field]);
  for (const field of NUMBER_FIELDS) if (field in payload) normalized[field] = toNumber(payload[field]);
  if ("fecha_analisis" in payload) normalized.fecha_analisis = toText(payload.fecha_analisis);
  return normalized;
}

export function validateAnalysisArrays(payload: Record<string, unknown>): void {
  for (const field of ANALYSIS_ARRAY_FIELDS) {
    if (!(field in payload)) continue;
    if (typeof payload[field] === "string") throw new Error(`El campo ${field} debe ser array y llegó como string.`);
    if (!Array.isArray(payload[field])) throw new Error(`El campo ${field} debe ser array.`);
    if (process.env.NODE_ENV === "development") {
      console.info("[ai/analysis-array]", { field, isArray: Array.isArray(payload[field]), type: typeof payload[field] });
    }
  }
}

export function isMalformedArrayError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as Record<string, unknown>;
  const detail = [value.code, value.message, value.details].map(toText).join(" ");
  return /22P02|malformed array literal|Array value must start with/i.test(detail);
}

export const MALFORMED_ARRAY_MESSAGE = "No se pudo guardar el análisis IA porque un campo tipo lista recibió texto plano. Revise la normalización de campos array.";
