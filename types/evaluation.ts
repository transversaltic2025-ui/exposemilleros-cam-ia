import type { EstadoEvaluacionHumana } from "@/lib/constants";

export interface EvaluationCriterion {
  criterio_id: string;
  nombre: string;
  descripcion: string;
  puntaje_maximo: number;
}

export interface HumanEvaluation {
  evaluacion_id: string;
  asignacion_id: string;
  codigo_proyecto: string;
  evaluador_id: string;
  estado: EstadoEvaluacionHumana;
  puntaje_pertinencia: number;
  puntaje_innovacion: number;
  puntaje_metodologia: number;
  puntaje_impacto: number;
  puntaje_comunicacion: number;
  puntaje_total: number;
  observaciones: string;
  fortalezas: string;
  oportunidades: string;
  recomendacion_final: "Destacado" | "Aprobar" | "Ajustar" | "No recomendado";
  concepto_evaluador: string;
  fecha_envio?: string;
}
