import type {
  CategoriaPresentacion,
  EstadoAnalisisIA,
  EstadoEvaluacionHumana,
  EstadoProyecto,
  LineaInvestigacion,
  LineaTematica,
  ModalidadParticipacion,
  Semillero,
} from "@/lib/constants";

export interface ProjectParticipant {
  nombre: string;
  documento: string;
  ficha?: string;
}

export type ProjectMemberRole =
  | "Autor principal"
  | "Aprendiz participante"
  | "Instructor"
  | "Investigador asociado";

export interface ProjectMember {
  id?: string;
  proyecto_id?: string;
  rol_integrante: ProjectMemberRole;
  nombre_completo: string;
  documento?: string;
  correo?: string;
  celular?: string;
  ficha?: string;
  es_menor_edad?: boolean;
  tratamiento_datos_menor_path?: string | null;
  tratamiento_datos_menor_nombre?: string | null;
  tratamiento_datos_menor_tipo?: string | null;
  tratamiento_datos_menor_size?: number | null;
  orden: number;
  created_at?: string;
}

export interface ProjectTeamPayload {
  autorPrincipal: {
    nombreCompleto: string;
    documento?: string;
    correo: string;
    celular: string;
  };
  aprendices: {
    nombreCompleto: string;
    documento: string;
    correo: string;
    celular: string;
    ficha?: string;
    esMenorEdad?: boolean;
    tratamientoDatosMenorPath?: string;
    tratamientoDatosMenorNombre?: string;
    tratamientoDatosMenorTipo?: string;
    tratamientoDatosMenorSize?: number;
  }[];
  instructoresInvestigadores: {
    nombreCompleto: string;
    documento: string;
    correo: string;
    celular: string;
    rol: Extract<ProjectMemberRole, "Instructor" | "Investigador asociado">;
  }[];
}

export interface Project {
  id?: string;
  codigo_proyecto?: string;
  nombre_proyecto?: string;
  linea_tematica: LineaTematica | string;
  modalidad_participacion: ModalidadParticipacion | string;
  semillero: Semillero | string;
  semillero_otro?: string;
  institucion: string;
  municipio: string;
  linea_tematica_otro?: string;
  resumen_problema?: string;
  resumen_objetivo?: string;
  resumen_metodologia?: string;
  resumen_resultados?: string;
  resumen_conclusiones?: string;
  modalidades_proyecto?: string[];
  modalidad_otro?: string;
  estado_desarrollo_proyecto?: string;
  productos_obtenidos?: string[];
  productos_obtenidos_otro?: string;
  nivel_madurez?: string;
  instructor_nombre: string;
  instructor_documento: string;
  instructor_correo: string;
  instructor_celular: string;
  instructor_2_nombre?: string;
  instructor_2_documento?: string;
  instructor_2_correo?: string;
  instructor_2_celular?: string;
  instructor_3_nombre?: string;
  instructor_3_documento?: string;
  instructor_3_correo?: string;
  instructor_3_celular?: string;
  rol_proyecto?: string;
  aprendiz_1_nombre?: string;
  aprendiz_1_documento?: string;
  aprendiz_1_correo?: string;
  aprendiz_1_celular?: string;
  aprendiz_1_ficha?: string;
  aprendiz_2_nombre?: string;
  aprendiz_2_documento?: string;
  aprendiz_2_correo?: string;
  aprendiz_2_celular?: string;
  aprendiz_2_ficha?: string;
  aprendiz_3_nombre?: string;
  aprendiz_3_documento?: string;
  aprendiz_3_correo?: string;
  aprendiz_3_celular?: string;
  aprendiz_3_ficha?: string;
  categoria_presentacion: CategoriaPresentacion | string;
  archivo_proyecto_url?: string;
  archivo_proyecto_path?: string;
  archivo_proyecto_nombre?: string;
  archivo_proyecto_tipo?: string;
  archivo_proyecto_size?: number;
  poster_proyecto_path?: string;
  poster_proyecto_nombre?: string;
  poster_proyecto_tipo?: string;
  poster_proyecto_size?: number;
  requiere_conexion_electrica?: boolean;
  requiere_mesa_mobiliario?: boolean;
  presenta_prototipo_funcional?: boolean;
  requiere_otro_elemento?: boolean;
  otro_elemento_descripcion?: string;
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
  area_conocimiento: LineaTematica | string;
  linea_investigacion?: LineaInvestigacion | string;
  participantes: ProjectParticipant[];
  integrantes: string[];
  equipo?: ProjectMember[];
  estado: EstadoProyecto;
  archivo_nombre?: string;
  archivo_storage_path?: string;
  archivo_url?: string;
  evaluadores_asignados: number;
  requiere_certificado?: boolean;
}
