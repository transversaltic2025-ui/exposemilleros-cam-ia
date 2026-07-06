export interface LogisticsSummary {
  proyectos: number;
  evaluadores: number;
  asignaciones: number;
  asignacionesPendientes?: number;
  evaluaciones: number;
  certificadosPendientes: number;
  proyectosSinEvaluador: number;
  proyectosConUnEvaluador: number;
  proyectosConDosEvaluadores: number;
}

export interface EventLogistics {
  fecha_evento: string;
  sede: string;
  aulas_requeridas: number;
  mesas_evaluacion: number;
  franjas: {
    nombre: string;
    hora_inicio: string;
    hora_fin: string;
    proyectos_programados: number;
  }[];
}
