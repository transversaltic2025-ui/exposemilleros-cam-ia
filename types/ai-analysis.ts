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
  recomendaciones_genero_ia?: string[];
  enfoque_etnico_ia?: string;
  nivel_inclusion_etnica_ia?: number;
  recomendaciones_etnicas_ia?: string[];
  enfoque_diferencial_ia?: string;
  riesgos_exclusion_ia?: string[];
  oportunidades_inclusion_ia?: string[];
  alertas_calidad?: string[];
  modelo_ia?: string;
  estado_analisis?: EstadoAnalisisIA;
  mensaje_error?: string;
  fecha_analisis?: string;
  created_at?: string;
}
