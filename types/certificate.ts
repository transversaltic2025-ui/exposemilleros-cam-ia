export interface CertificateRecord {
  certificado_id: string;
  tipo: "Participante" | "Instructor" | "Evaluador";
  nombre: string;
  documento: string;
  codigo_proyecto?: string;
  rol: string;
  fecha_evento: string;
  estado: "Pendiente" | "Generado" | "Enviado";
  archivo_certificado_url?: string;
}
