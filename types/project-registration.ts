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
}

export interface ProjectRegistrationInput {
  titulo: string;
  resumen: string;
  linea_tematica: LineaTematica;
  modalidad_participacion: ModalidadParticipacion;
  semillero: Semillero;
  categoria_presentacion: CategoriaPresentacion;
  municipio: string;
  institucion: string;
  participantes: ProjectParticipantRegistration[];
  instructor_nombre: string;
  instructor_documento: string;
  instructor_correo: string;
  instructor_celular: string;
  autoriza_tratamiento_datos: OpcionSiNo;
  requiere_certificado: OpcionSiNo;
  archivo_nombre: string;
}
