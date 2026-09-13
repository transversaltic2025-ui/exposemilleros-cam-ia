export function certificateErrorMessage(error: unknown, fallback = "Error inesperado generando certificados.") {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return typeof error === "string" && error ? error : fallback;
}
