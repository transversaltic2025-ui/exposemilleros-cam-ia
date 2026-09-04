export const CERTIFICATE_TEMPLATE_TYPES = [
  "General", "Ponentes", "Instructores", "Líder de proyecto", "Evaluadores", "Evaluador productores campesinos", "Productores campesinos", "Jóvenes emprendedores",
] as const;

export type CertificateTemplateType = (typeof CERTIFICATE_TEMPLATE_TYPES)[number];
export interface TextPosition { x: number; y: number; size: number; maxWidth: number; align: "center" | "left"; }
export interface CertificateTemplate {
  id: string; nombre: string; tipo_certificado: CertificateTemplateType; bucket: string;
  archivo_path: string; archivo_nombre: string; archivo_tipo: string; archivo_size: number;
  activo: boolean; posiciones: { nombre?: TextPosition; documento?: TextPosition; rol?: TextPosition }; created_at?: string;
}
export const DEFAULT_TEXT_POSITIONS = {
  nombre: { x: 420, y: 395, size: 28, maxWidth: 720, align: "center" },
  documento: { x: 505, y: 365, size: 14, maxWidth: 220, align: "left" },
  rol: { x: 315, y: 318, size: 18, maxWidth: 220, align: "center" },
} satisfies Record<"nombre" | "documento" | "rol", TextPosition>;
