import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { cleanCertificateText } from "@/lib/certificates/text";
import type { TextPosition } from "@/types/certificate-template";

export interface CertificatePdfInput {
  nombrePersona: string;
  documentoPersona: string;
  rolCertificado: string;
  tipoCertificado: "Participante" | "Ponente" | "Instructor" | "Líder de proyecto" | "Evaluador" | "Evaluador productores campesinos";
}

export interface CertificatePdfOptions {
  templateBytes: Uint8Array;
  templateName?: string;
  positions: { nombre: TextPosition; documento: TextPosition; rol: TextPosition };
}

export function fitTextToWidth(
  text: string,
  font: PDFFont,
  initialSize: number,
  maxWidth: number,
  minSize = 16,
) {
  const effectiveMinSize = Math.min(initialSize, minSize);
  let size = initialSize;
  while (size > effectiveMinSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return Math.max(size, effectiveMinSize);
}

function drawCertificateText(page: PDFPage, value: string, font: PDFFont, position: TextPosition) {
  const text = cleanCertificateText(value);
  const size = fitTextToWidth(text, font, position.size, position.maxWidth);
  const width = font.widthOfTextAtSize(text, size);
  const x = position.align === "left" ? position.x : position.x - width / 2;

  if (process.env.NODE_ENV === "development") {
    console.log("[certificates/pdf] campo", { text, size, width, position });
  }
  page.drawText(text, { x, y: position.y, size, font, color: rgb(0, 0, 0) });
}

/** Única función de renderizado para vista previa y certificados reales. */
export async function generateCertificatePdf(input: CertificatePdfInput, options: CertificatePdfOptions) {
  const nombre = cleanCertificateText(input.nombrePersona);
  const documento = cleanCertificateText(input.documentoPersona);
  const rol = cleanCertificateText(input.rolCertificado);
  if (!nombre || !documento || !rol) {
    throw new Error("No se generó el certificado porque falta nombre, documento o rol.");
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[certificates/pdf] generación", {
      plantilla: options.templateName,
      posiciones: options.positions,
      nombre,
      documento,
      rol,
    });
  }

  const pdf = await PDFDocument.load(options.templateBytes);
  const page = pdf.getPages()[0];
  if (!page) throw new Error("La plantilla del certificado no contiene páginas.");

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  drawCertificateText(page, nombre, font, options.positions.nombre);
  drawCertificateText(page, documento, font, options.positions.documento);
  drawCertificateText(page, rol, font, options.positions.rol);
  return Buffer.from(await pdf.save());
}
