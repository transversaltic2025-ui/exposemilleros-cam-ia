/**
 * Normaliza texto antes de enviarlo a las fuentes estándar WinAnsi de pdf-lib.
 * Conserva caracteres españoles de Latin-1 y descarta controles, emojis y otros
 * símbolos que Helvetica estándar no puede codificar.
 */
export function cleanCertificateText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
