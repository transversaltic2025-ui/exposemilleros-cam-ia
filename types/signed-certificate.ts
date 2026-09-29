import type { CertificateRecord } from "./certificate";

export type SignedCertificate = CertificateRecord & { id: string };
export type UploadResult = {
  archivo: string;
  documento: string;
  tipo?: string;
  certificado?: string;
  estado: "Asociado" | "No asociado" | "Duplicado" | "Reemplazado" | "Error";
  motivo: string;
};
export type AssociationError = { id: string; archivo: string; documento: string; motivo: string };
export type PublicCertificate = {
  id: string;
  nombre_persona: string;
  documento_mostrado: string;
  tipo_certificado: string;
  proyecto: string | null;
  estado_firma: "Firmado";
  certificado_firmado_at: string | null;
  downloadUrl: string;
};
