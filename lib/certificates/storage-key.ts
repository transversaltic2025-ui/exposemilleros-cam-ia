export function sanitizeStorageKey(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/]+/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function certificateTypeToStorageFolder(tipo: string) {
  const folders: Record<string, string> = {
    Ponente: "ponentes",
    "Líder de proyecto": "lider-proyecto",
    Evaluador: "evaluadores",
    "Evaluador productores campesinos": "evaluadores-productores",
    "Productor campesino participante": "productores-campesinos",
    "Joven emprendedor participante": "jovenes-emprendedores",
  };
  return folders[tipo] ?? sanitizeStorageKey(tipo);
}
