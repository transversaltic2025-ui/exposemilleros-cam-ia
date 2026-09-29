export function signedStatusFilter(value?: string) {
  if (value === "Firmado" || value === "firmados") return "Firmado";
  if (value === "Pendiente de firma" || value === "pendientes") return "Pendiente de firma";
  return "Todos";
}
