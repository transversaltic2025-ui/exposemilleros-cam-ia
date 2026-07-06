export interface CertificateRecord {
  id?: string;
  tipo_certificado?: "Participante" | "Ponente" | "Instructor" | "Evaluador";
  nombre_persona?: string;
  documento_persona?: string;
  rol_certificado?: string;
  proyecto_id?: string | null;
  evaluador_id?: string | null;
  url_certificado?: string | null;
  estado_certificado?: "Pendiente" | "Generado" | "Enviado";
  created_at?: string;

  tipo?: "Participante" | "Instructor" | "Evaluador";
  nombre?: string;
  documento?: string;
  codigo_proyecto?: string;
  rol?: string;
  fecha_evento?: string;
  archivo_certificado_url?: string;
  certificado_id?: string;
  estado?: "Pendiente" | "Generado" | "Enviado";

  proyecto_nombre?: string;
  proyecto_codigo?: string;
}
