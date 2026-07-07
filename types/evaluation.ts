import type { EstadoEvaluacionHumana } from "@/lib/constants";

export interface EvaluationCriterion {
  id?: string;
  codigo_criterio?: string;
  nombre_criterio?: string;
  descripcion: string;
  puntaje_maximo: number;
  peso?: number;
  activo?: boolean;
  orden?: number;

  criterio_id?: string;
  nombre?: string;
}

export interface HumanEvaluation {
  id?: string;
  asignacion_id: string;
  proyecto_id: string;
  evaluador_id: string;
  concepto_evaluador: string;
  fortalezas?: string;
  oportunidades_mejora?: string;
  recomendacion_final?: string | null;
  puntaje_total: number;
  promedio?: number;
  porcentaje?: number;
  nivel_tendencia?: string;
  created_at?: string;

  evaluacion_id?: string;
  estado?: EstadoEvaluacionHumana;
  puntaje_pertinencia?: number;
  puntaje_innovacion?: number;
  puntaje_metodologia?: number;
  puntaje_impacto?: number;
  puntaje_comunicacion?: number;
  observaciones?: string;
  oportunidades?: string;
  fecha_envio?: string;
  proyecto_codigo?: string;
  proyecto_nombre?: string;
  proyecto_area?: string;
}

export interface EvaluationDetailInput {
  criterio_id: string;
  puntaje: number;
  observacion_criterio?: string;
}
