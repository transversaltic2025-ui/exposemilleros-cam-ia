import { sanitizeStorageKey } from "./storage-key";
import type { SignedCertificate } from "@/types/signed-certificate";

export function normalizeDocument(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export function documentFromFilename(filename: string) {
  const basename = filename.split(/[\\/]/).pop()!.replace(/\.pdf$/i, "");
  // In TIPO - NOMBRE - DOCUMENTO, hyphens inside the final document are
  // formatting, while spaced hyphens separate the filename fields.
  const fields = basename.split(/\s+-\s+/);
  const documentField = fields.at(-1)?.trim() ?? "";
  if (fields.length >= 3 && /^[\d.\s-]+$/.test(documentField)) {
    const document = normalizeDocument(documentField);
    return document.length >= 5 ? document : "";
  }
  // Legacy names may put the document at the beginning or in the middle.
  // Count actual digits, not formatting characters, and reject ambiguity.
  const groups = basename.match(/(?<![\p{L}\d])\d[\d.\s]*(?![\p{L}\d])/gu) ?? [];
  const documents = [...new Set(groups.map(normalizeDocument).filter(value => value.length >= 5))];
  return documents.length === 1 ? documents[0] : "";
}

function certificateType(value: string) {
  const clean = sanitizeStorageKey(value);
  const types: Record<string, string> = {
    evaluador: "Evaluador",
    ponente: "Ponente",
    "lider-de-proyecto": "Líder de proyecto",
    lider: "Líder de proyecto",
    instructor: "Líder de proyecto",
    "instructor-lider": "Líder de proyecto",
    investigador: "Investigador",
    "evaluador-productores-campesinos": "Evaluador productores campesinos",
    "productor-campesino-participante": "Productor campesino participante",
    "joven-emprendedor-participante": "Joven emprendedor participante",
  };
  return types[clean] ?? "";
}

export function parseSignedCertificateFilename(filename: string) {
  const basename = filename.split(/[\\/]/).pop()!.replace(/\.pdf$/i, "");
  const firstHyphen = basename.indexOf("-");
  const tipo = firstHyphen >= 0 ? certificateType(basename.slice(0, firstHyphen).trim()) : "";
  const fields = basename.split(/\s+-\s+/);
  const nombre = fields.length >= 3 ? fields.slice(1, -1).join(" - ").trim() : "";
  return { tipo, nombre, documento: documentFromFilename(filename) };
}

export function matchSignedCertificate(filename: string, rows: SignedCertificate[]) {
  const { documento, tipo, nombre } = parseSignedCertificateFilename(filename);
  let candidates = documento ? rows.filter(row => normalizeDocument(row.documento_persona) === documento) : [];
  // A recognized type must match even when only one record has this document.
  if (tipo) candidates = candidates.filter(row => certificateType(row.tipo_certificado ?? "") === tipo);
  return { documento, tipo, nombre, certificate: candidates.length === 1 ? candidates[0] : null,
    motivo: !documento ? "No se detectó un documento único en el nombre." : candidates.length > 1
      ? "Varios certificados coinciden. Seleccione el registro en la carga individual."
      : candidates.length === 0 ? "No se encontró certificado generado para este documento y tipo." : "" };
}
