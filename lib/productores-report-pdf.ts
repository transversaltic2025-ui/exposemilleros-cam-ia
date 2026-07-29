import "server-only";
import { displayList } from "@/lib/productores-export";

const clean = (value: unknown) => String(value ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^\x20-\x7E\xA0-\xFF]/g, "-")
  .replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
const text = (value: unknown, x: number, y: number, size = 8, bold = false) =>
  `0 0 0 rg\nBT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${clean(value)}) Tj ET\n`;
const shorten = (value: unknown, length: number) => {
  const raw = displayList(value);
  return raw.length > length ? `${raw.slice(0, length - 3)}...` : raw || "-";
};

export function createProductoresReportPdf(items: Record<string, unknown>[]) {
  const rowsPerPage = 24;
  const pages = Math.max(1, Math.ceil(items.length / rowsPerPage));
  const objects: string[] = [];
  const pageIds: number[] = [];
  objects.push(""); // catálogo
  objects.push(""); // páginas
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  for (let page = 0; page < pages; page++) {
    let stream = text("Reporte de iniciativas campesinas", 34, 565, 18, true);
    stream += text(`Generado: ${new Date().toLocaleString("es-CO")}   Total: ${items.length}`, 34, 545, 9);
    stream += "0.90 0.94 0.92 rg 30 514 782 22 re f\n";
    const headers = [["Codigo", 34], ["Iniciativa", 110], ["Productor", 245], ["Municipio", 365], ["Linea productiva", 445], ["Madurez", 565], ["Dificultad", 650]] as const;
    headers.forEach(([label, x]) => { stream += text(label, x, 521, 7, true); });
    items.slice(page * rowsPerPage, (page + 1) * rowsPerPage).forEach((item, index) => {
      const y = 496 - index * 19;
      if (index % 2) stream += `0.97 0.97 0.97 rg 30 ${y - 6} 782 17 re f\n`;
      stream += text(shorten(item.codigo_iniciativa, 13), 34, y, 6.5);
      stream += text(shorten(item.nombre_iniciativa, 24), 110, y, 6.5);
      stream += text(shorten(item.nombre_productor, 21), 245, y, 6.5);
      stream += text(shorten(item.municipio, 13), 365, y, 6.5);
      stream += text(shorten(item.linea_productiva, 20), 445, y, 6.5);
      stream += text(shorten(item.nivel_madurez, 14), 565, y, 6.5);
      stream += text(shorten(item.principal_dificultad, 27), 650, y, 6.5);
    });
    stream += text(`Pagina ${page + 1} de ${pages}`, 735, 24, 7);
    const pageId = objects.length + 1;
    const contentId = pageId + 1;
    pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}endstream`);
  }
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pages} >>`;

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
    chunks.push(Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`, "latin1"));
  });
  const xrefOffset = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  chunks.push(Buffer.from([
    "xref", `0 ${objects.length + 1}`, "0000000000 65535 f ",
    ...offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer", `<< /Size ${objects.length + 1} /Root 1 0 R >>`, "startxref", xrefOffset, "%%EOF", "",
  ].join("\n"), "latin1"));
  return Buffer.concat(chunks);
}
