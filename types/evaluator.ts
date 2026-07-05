import type { LineaTematica } from "@/lib/constants";

export interface Evaluator {
  evaluador_id: string;
  fecha_registro: string;
  nombre: string;
  correo: string;
  celular: string;
  documento: string;
  entidad: string;
  area_conocimiento: LineaTematica;
  disponibilidad: string;
  proyectos_asignados: number;
  max_proyectos: 3;
  estado: "Disponible" | "Completo" | "Inactivo";
  requiere_certificado: boolean;
}
