import type { LineaTematica } from "@/lib/constants";

export interface Evaluator {
  id?: string;
  codigo_evaluador?: string;
  nombre_evaluador?: string;
  documento_evaluador?: string;
  correo_evaluador?: string;
  celular_evaluador?: string;
  institucion_evaluador?: string;
  area_conocimiento: LineaTematica | string;
  estado_evaluador?: "Activo" | "Inactivo";
  cantidad_proyectos_asignados?: number;
  token_acceso?: string | null;
  fecha_ultimo_acceso?: string | null;
  url_certificado_evaluador?: string | null;
  observaciones_admin?: string | null;
  created_at?: string;

  evaluador_id?: string;
  fecha_registro?: string;
  nombre?: string;
  correo?: string;
  celular?: string;
  documento?: string;
  entidad?: string;
  disponibilidad?: string;
  proyectos_asignados?: number;
  max_proyectos?: 3;
  estado?: "Disponible" | "Completo" | "Inactivo";
  requiere_certificado?: boolean;
}
