import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export interface CertificatePdfInput {
  nombrePersona: string;
  rolCertificado: string;
  nombreProyecto?: string;
  lineaTematica?: string;
  semillero?: string;
  areaConocimiento?: string;
  tipoCertificado: "Participante" | "Ponente" | "Instructor" | "Evaluador";
}

export const CERTIFICATE_TEXT_POSITIONS = {
  rol: {
    x: 420,
    y: 260,
    size: 18,
    maxWidth: 260,
    align: "center",
  },
} as const;

const MIN_ROLE_FONT_SIZE = 8;
function getTemplatePath() {
  const configuredPath = process.env.CERTIFICATE_TEMPLATE_PATH?.trim();
  if (configuredPath) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredPath);
  }

  return path.join(process.cwd(), "public", "templates", "certificado.pdf");
}

function fontSizeToFit(text: string, font: PDFFont, preferredSize: number, maxWidth: number) {
  let size = preferredSize;

  while (size > MIN_ROLE_FONT_SIZE && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }

  return size;
}

/** Usa la plantilla como fondo y superpone exclusivamente el rol. */
export async function createCertificatePdf(input: CertificatePdfInput) {
  const role = input.rolCertificado.trim();
  if (!role) {
    throw new Error("El rol del certificado es obligatorio.");
  }

  let templateBytes: Buffer;
  const templatePath = getTemplatePath();

  try {
    templateBytes = await readFile(templatePath);
  } catch (error) {
    throw new Error(
      `No se pudo leer la plantilla del certificado en ${templatePath}. ` +
        "Agregue el PDF institucional o configure CERTIFICATE_TEMPLATE_PATH.",
      { cause: error },
    );
  }

  const pdf = await PDFDocument.load(templateBytes);
  const page = pdf.getPages()[0];
  if (!page) {
    throw new Error("La plantilla del certificado no contiene páginas.");
  }

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const position = CERTIFICATE_TEXT_POSITIONS.rol;
  const size = fontSizeToFit(role, font, position.size, position.maxWidth);
  const width = font.widthOfTextAtSize(role, size);

  page.drawText(role, {
    x: position.x - width / 2,
    y: position.y,
    size,
    font,
    color: rgb(0, 0, 0),
  });

  return Buffer.from(await pdf.save());
}
