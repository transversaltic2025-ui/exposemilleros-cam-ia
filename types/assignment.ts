import type { EstadoAsignacion, LineaTematica } from "@/lib/constants";

export interface Assignment {
  asignacion_id: string;
  codigo_proyecto: string;
  titulo_proyecto: string;
  evaluador_id: string;
  evaluador_nombre: string;
  area_conocimiento: LineaTematica;
  token: string;
  fecha_asignacion: string;
  estado: EstadoAsignacion;
  archivo_abierto: boolean;
  fecha_apertura_archivo?: string;
}
