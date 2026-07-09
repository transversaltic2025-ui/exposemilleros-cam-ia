import type { EstadoAsignacion, LineaTematica } from "@/lib/constants";

export interface Assignment {
  id?: string;
  token_evaluacion?: string;
  proyecto_id?: string;
  evaluador_id: string;
  estado_asignacion?: EstadoAsignacion;
  fecha_asignacion?: string;
  fecha_limite?: string | null;
  permitir_edicion?: boolean;
  url_evaluacion?: string | null;
  fecha_envio_evaluacion?: string | null;
  observaciones_admin?: string | null;
  proyecto_codigo?: string;
  proyecto_nombre?: string;
  proyecto_area?: LineaTematica | string;
  evaluador_codigo?: string;
  evaluador_nombre?: string;

  asignacion_id?: string;
  codigo_proyecto?: string;
  titulo_proyecto?: string;
  area_conocimiento?: LineaTematica | string;
  token?: string;
  estado?: EstadoAsignacion;
  archivo_abierto?: boolean;
  fecha_apertura_archivo?: string;
}
