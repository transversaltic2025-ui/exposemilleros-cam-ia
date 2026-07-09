import type { EvaluationCriterion } from "@/types";

export interface EvaluationDetailSubmission {
  criterio_id: string;
  puntaje: number;
  observacion_criterio?: string;
}

export interface EvaluationSubmissionValues {
  archivo_abierto: boolean;
  puntaje_pertinencia?: number;
  puntaje_innovacion?: number;
  puntaje_metodologia?: number;
  puntaje_impacto?: number;
  puntaje_comunicacion?: number;
  observaciones?: string;
  fortalezas: string;
  oportunidades?: string;
  oportunidades_mejora?: string;
  recomendacion_final?: string | null;
  concepto_evaluador: string;
  detalles?: EvaluationDetailSubmission[];
}

export interface EvaluationSimulationResult {
  puntaje_total: number;
  promedio: number;
  porcentaje: number;
  nivel_tendencia: string;
  concepto_evaluador: string;
}

export function getNivelTendencia(porcentaje: number) {
  if (porcentaje < 40) {
    return "Bajo nivel de tendencia";
  }
  if (porcentaje < 65) {
    return "Nivel moderado de tendencia";
  }
  if (porcentaje < 80) {
    return "Nivel alto de tendencia";
  }
  return "Proyecto altamente tendencial";
}

export function calculateEvaluationSimulation(
  values: EvaluationSubmissionValues,
  criterios: EvaluationCriterion[],
): EvaluationSimulationResult {
  const oldScores = [
    values.puntaje_pertinencia,
    values.puntaje_innovacion,
    values.puntaje_metodologia,
    values.puntaje_impacto,
    values.puntaje_comunicacion,
  ].filter((score): score is number => typeof score === "number");

  const details = values.detalles?.length
    ? values.detalles
    : criterios.slice(0, oldScores.length).map((criterio, index) => ({
        criterio_id: criterio.id ?? criterio.criterio_id ?? "",
        puntaje: oldScores[index] ?? 0,
        observacion_criterio: values.observaciones ?? "",
      }));

  const puntaje_total = details.length > 0
    ? details.reduce((sum, detail) => sum + detail.puntaje, 0)
    : oldScores.reduce((sum, score) => sum + score, 0);

  const maxTotal = details.length > 0
    ? details.reduce((sum, detail) => {
        const criterio = criterios.find((item) => (item.id ?? item.criterio_id) === detail.criterio_id);
        return sum + (criterio?.puntaje_maximo ?? 20);
      }, 0)
    : oldScores.length * 20;

  const promedio = details.length > 0 || oldScores.length > 0
    ? puntaje_total / Math.max(details.length || oldScores.length, 1)
    : 0;
  const porcentaje = maxTotal > 0 ? Math.round((puntaje_total / maxTotal) * 100) : 0;

  return {
    puntaje_total,
    promedio,
    porcentaje,
    nivel_tendencia: getNivelTendencia(porcentaje),
    concepto_evaluador: values.concepto_evaluador,
  };
}
