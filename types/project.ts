import type {
  CategoriaPresentacion,
  EstadoAnalisisIA,
  EstadoEvaluacionHumana,
  EstadoProyecto,
  LineaTematica,
  ModalidadParticipacion,
  Semillero,
} from "@/lib/constants";

export interface ProjectParticipant {
  nombre: string;
  documento: string;
}

export interface Project {
  id?: string;
  codigo_proyecto?: string;
  nombre_proyecto?: string;
  linea_tematica: LineaTematica;
  modalidad_participacion: ModalidadParticipacion;
  semillero: Semillero;
  institucion: string;
  municipio: string;
  instructor_nombre: string;
  instructor_documento: string;
  instructor_correo: string;
  instructor_celular: string;
  rol_proyecto?: string;
  aprendiz_1_nombre?: string;
  aprendiz_1_documento?: string;
  aprendiz_1_correo?: string;
  aprendiz_1_celular?: string;
  aprendiz_2_nombre?: string;
  aprendiz_2_documento?: string;
  aprendiz_2_correo?: string;
  aprendiz_2_celular?: string;
  aprendiz_3_nombre?: string;
  aprendiz_3_documento?: string;
  aprendiz_3_correo?: string;
  aprendiz_3_celular?: string;
  categoria_presentacion: CategoriaPresentacion;
  archivo_proyecto_url?: string;
  archivo_proyecto_path?: string;
  archivo_proyecto_nombre?: string;
  archivo_proyecto_tipo?: string;
  archivo_proyecto_size?: number;
  requiere_conexion_electrica?: boolean;
  requiere_mesa_mobiliario?: boolean;
  presenta_prototipo_funcional?: boolean;
  observaciones_adicionales?: string;
  estado_proyecto?: EstadoProyecto;
  estado_evaluacion_humana?: EstadoEvaluacionHumana;
  estado_analisis_ia?: EstadoAnalisisIA;
  estado_lectura_archivo?: "Pendiente" | "Leido" | "Error";
  observaciones_admin?: string;
  created_at?: string;
  updated_at?: string;

  codigo: string;
  fecha_registro: string;
  titulo: string;
  resumen?: string;
  area_conocimiento: LineaTematica;
  linea_investigacion?: LineaTematica | string;
  participantes: ProjectParticipant[];
  integrantes: string[];
  estado: EstadoProyecto;
  archivo_nombre?: string;
  archivo_storage_path?: string;
  archivo_url?: string;
  evaluadores_asignados: number;
  requiere_certificado?: boolean;
}
