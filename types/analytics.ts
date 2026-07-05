import type { LineaTematica } from "@/lib/constants";

export interface TrendByArea {
  area: LineaTematica;
  proyectos: number;
  puntajePromedio: number;
}

export interface HumanVsAIComparison {
  codigo_proyecto: string;
  puntaje_humano: number | null;
  puntaje_ia: number | null;
  diferencia: number | null;
  concepto_evaluador?: string;
  concepto_ia?: string;
}
