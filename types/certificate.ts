export interface CertificateRecord {
  certificado_firmado_path?: string | null;
  certificado_firmado_nombre?: string | null;
  certificado_firmado_tipo?: string | null;
  certificado_firmado_size?: number | null;
  certificado_firmado_at?: string | null;
  certificado_firmado_subido_por?: string | null;
  iniciativa_id?: string | null;
  iniciativa_nombre?: string | null;
  iniciativa_codigo?: string | null;
  estado_firma?: "Pendiente de firma" | "Firmado" | "Reemplazado" | "Error de asociación" | null;
  id?: string;
  tipo_certificado?: "Participante" | "Ponente" | "Instructor" | "Líder de proyecto" | "Evaluador" | "Evaluador productores campesinos" | "Investigador";
  nombre_persona?: string;
  documento_persona?: string;
  rol_certificado?: string;
  rol_participacion?: string;
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
