import type {
  CategoriaPresentacion,
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
  codigo: string;
  fecha_registro: string;
  titulo: string;
  resumen: string;
  linea_tematica: LineaTematica;
  area_conocimiento: LineaTematica;
  linea_investigacion: LineaTematica;
  modalidad_participacion: ModalidadParticipacion;
  semillero: Semillero;
  categoria_presentacion: CategoriaPresentacion;
  institucion: string;
  municipio: string;
  participantes: ProjectParticipant[];
  integrantes: string[];
  instructor_nombre: string;
  instructor_documento: string;
  instructor_correo: string;
  instructor_celular: string;
  estado: EstadoProyecto;
  archivo_nombre: string;
  archivo_drive_id?: string;
  archivo_url?: string;
  evaluadores_asignados: number;
  requiere_certificado: boolean;
}
