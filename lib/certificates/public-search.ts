import { z } from "zod";
import { normalizeDocument } from "./signed-matching";

export function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}
export function maskDocument(value: unknown) {
  const document = normalizeDocument(value);
  return document.length > 4 ? "*".repeat(document.length - 4) + document.slice(-4) : "*".repeat(document.length);
}
export const publicSearchSchema = z.object({
  documento: z.string().max(80).default(""),
  nombre: z.string().max(160).default(""),
}).strict().superRefine((value, context) => {
  if (!value.documento.trim() && !value.nombre.trim()) {
    context.addIssue({ code: "custom", path: ["documento"], message: "Digite un n\u00famero de documento v\u00e1lido." });
  } else if (value.documento.trim()) {
    if (!/^\d{5,25}$/.test(normalizeDocument(value.documento))) context.addIssue({ code: "custom", path: ["documento"], message: "Digite un n\u00famero de documento v\u00e1lido." });
    if (value.nombre.trim()) context.addIssue({ code: "custom", path: ["nombre"], message: "Seleccione una sola forma de b\u00fasqueda." });
  } else if (normalizeSearchText(value.nombre).replace(/\s/g, "").length < 4) {
    context.addIssue({ code: "custom", path: ["nombre"], message: "Digite al menos 4 caracteres para buscar por nombre." });
  } else if (!/[\p{L}]/u.test(value.nombre)) {
    context.addIssue({ code: "custom", path: ["nombre"], message: "Ingrese un nombre o apellido v\u00e1lido." });
  }
});
export function matchesSearchName(name: string, search: string) {
  const normalized = normalizeSearchText(name);
  return normalizeSearchText(search).split(" ").every(token => normalized.includes(token));
}
