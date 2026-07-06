export interface CertificatePdfInput {
  nombrePersona: string;
  rolCertificado: string;
  nombreProyecto?: string;
  lineaTematica?: string;
  semillero?: string;
  areaConocimiento?: string;
  tipoCertificado: "Participante" | "Ponente" | "Instructor" | "Evaluador";
}

function pdfText(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function textLine(text: string, x: number, y: number, size: number, font = "F1") {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(text)}) Tj ET\n`;
}

function centerText(text: string, y: number, size: number, font = "F1") {
  const approximateWidth = text.length * size * 0.28;
  const x = Math.max(70, 421 - approximateWidth);
  return textLine(text, x, y, size, font);
}

function buildPdf(objects: string[]) {
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets: number[] = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(chunks.reduce((total, chunk) => total + chunk.length, 0));
    chunks.push(Buffer.from(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`, "latin1"));
  }

  const xrefOffset = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    "",
  ].join("\n");

  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}

export function createCertificatePdf(input: CertificatePdfInput) {
  const isEvaluator = input.tipoCertificado === "Evaluador";
  const title = "ExpoSemilleros CAM IA";
  const subtitle = "Encuentro de Semilleros de Investigación CAM 2026";
  const eventLine = "ExpoInnovación y CampeSENA";

  let content = "";
  content += "0.08 0.45 0.40 RG 3 w 36 36 770 523 re S\n";
  content += "0.90 0.96 0.94 rg 48 477 746 58 re f\n";
  content += centerText(title, 500, 24);
  content += centerText(subtitle, 472, 14);
  content += centerText("Certifica que", 420, 18);
  content += centerText(input.nombrePersona.toUpperCase(), 374, 30);
  content += centerText(
    isEvaluator
      ? "participó como evaluador en el Encuentro de Semilleros de Investigación CAM 2026 - ExpoInnovación y CampeSENA"
      : "participó en el Encuentro de Semilleros de Investigación CAM 2026 - ExpoInnovación y CampeSENA",
    330,
    12,
  );

  if (isEvaluator) {
    content += textLine("Area de conocimiento:", 110, 272, 13);
    content += textLine(input.areaConocimiento ?? "No registrada", 260, 272, 13);
  } else {
    content += textLine("Rol:", 110, 272, 13);
    content += textLine(input.rolCertificado, 260, 272, 13);
    content += textLine("Proyecto:", 110, 238, 13);
    content += textLine(input.nombreProyecto ?? "Proyecto registrado", 260, 238, 13);
    content += textLine("Línea temática:", 110, 204, 13);
    content += textLine(input.lineaTematica ?? "No registrada", 260, 204, 13);
    content += textLine("Semillero:", 110, 170, 13);
    content += textLine(input.semillero ?? "No registrado", 260, 170, 13);
  }

  content += textLine("Lugar y fecha:", 110, 112, 13);
  content += textLine("Centro Agroindustrial del Meta, 2026", 260, 112, 13);
  content += centerText(eventLine, 70, 11);

  const contentLength = Buffer.byteLength(content, "latin1");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${contentLength} >>\nstream\n${content}endstream`,
  ];

  return buildPdf(objects);
}
