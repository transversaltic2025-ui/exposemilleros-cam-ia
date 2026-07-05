import type { EstadoAnalisisIA } from "@/lib/constants";

export interface AIAnalysis {
  analisis_id: string;
  codigo_proyecto: string;
  archivo_drive_id?: string;
  estado: EstadoAnalisisIA;
  resumen_ia: string;
  tendencias_identificadas: string[];
  puntaje_sugerido_ia: number | null;
  nivel_tendencia_ia: "Bajo" | "Medio" | "Alto" | "Sobresaliente" | "No disponible";
  concepto_ia: string;
  alertas_calidad: string[];
  fecha_analisis?: string;
}
