import type {
  CategoriaPresentacion,
  LineaTematica,
  ModalidadParticipacion,
  OpcionSiNo,
  Semillero,
} from "@/lib/constants";

export interface ProjectParticipantRegistration {
  nombre: string;
  documento: string;
  correo?: string;
  celular?: string;
  ficha?: string;
}

export interface ProjectRegistrationInput {
  codigo_proyecto?: string;
  nombre_proyecto: string;
  linea_tematica: LineaTematica;
  modalidad_participacion: ModalidadParticipacion;
  semillero: Semillero;
  institucion: string;
  municipio: string;
  instructor_nombre: string;
  instructor_documento?: string;
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
  participantes: ProjectParticipantRegistration[];
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
  categoria_presentacion: CategoriaPresentacion;
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
  autoriza_tratamiento_datos: OpcionSiNo;
  requiere_certificado: OpcionSiNo;
}
