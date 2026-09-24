import type { CertificateRecord } from "./certificate";

export type SignedCertificate = CertificateRecord & { id: string };
export type UploadResult = {
  archivo: string;
  documento: string;
  certificado?: string;
  estado: "Asociado" | "No asociado" | "Duplicado" | "Reemplazado" | "Error";
  motivo: string;
};
export type AssociationError = { id: string; archivo: string; documento: string; motivo: string };
export type PublicCertificate = {
  nombre_persona: string;
  tipo_certificado: string;
  proyecto: string | null;
  fecha_generacion: string | null;
  descarga: string;
};
