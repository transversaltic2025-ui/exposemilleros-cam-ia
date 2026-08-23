import type { EstadoAnalisisIA } from "@/lib/constants";

export interface AIAnalysis {
  id?: string;
  analisis_id?: string;
  proyecto_id: string;
  archivo_storage_path?: string;
  estado?: EstadoAnalisisIA;
  resumen_ia: string;
  tendencias_identificadas: string[];
  palabras_clave_ia?: string[];
  sectores_relacionados?: string[];
  nivel_innovacion_ia?: number;
  nivel_pertinencia_ia?: number;
  nivel_impacto_ia?: number;
  nivel_viabilidad_ia?: number;
  nivel_claridad_metodologica_ia?: number;
  nivel_articulacion_tendencias_ia?: number;
  riesgos_detectados?: string[];
  oportunidades_detectadas?: string[];
  puntaje_sugerido_ia: number | null;
  promedio_ia?: number;
  porcentaje_ia?: number;
  nivel_tendencia_ia:
    | "Bajo"
    | "Medio"
    | "Alto"
    | "Sobresaliente"
    | "No disponible"
    | "Bajo nivel de tendencia"
    | "Tendencia emergente debil"
    | "Tendencia emergente relevante"
    | "Tendencia fuerte"
    | "Proyecto altamente tendencial";
  concepto_ia: string;
  enfoque_genero_ia?: string;
  nivel_inclusion_genero_ia?: number;
  mujeres_involucradas_ia?: string;
  mujeres_en_formulacion_ia?: string;
  mujeres_en_ejecucion_ia?: string;
  evidencia_genero_ia?: string;
  evidencia_mujeres_involucradas_ia?: string;
  evidencia_mujeres_formulacion_ia?: string;
  evidencia_mujeres_ejecucion_ia?: string;
  poblacion_impactada_ia?: string;
  evidencia_poblacion_impactada_ia?: string;
  brechas_genero_ia?: string[];
  acciones_genero_recomendadas_ia?: string[];
  recomendaciones_genero_ia?: string | string[];
  enfoque_etnico_ia?: string;
  nivel_inclusion_etnica_ia?: number;
  recomendaciones_etnicas_ia?: string[];
  enfoque_diferencial_ia?: string;
  grupos_diferenciales_identificados_ia?: string[];
  evidencia_enfoque_diferencial_ia?: string;
  nivel_evidencia_genero_ia?: "Explícita" | "Parcial" | "No reportada explícitamente";
  nivel_evidencia_diferencial_ia?: "Explícita" | "Parcial" | "No reportada explícitamente";
  riesgos_exclusion_ia?: string[];
  oportunidades_inclusion_ia?: string[];
  alertas_calidad?: string[];
  modelo_ia?: string;
  estado_analisis?: EstadoAnalisisIA;
  mensaje_error?: string;
  fecha_analisis?: string;
  created_at?: string;
}
