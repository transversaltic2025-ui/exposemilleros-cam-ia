export async function readUploadResponse(response: Response) {
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); }
  catch { data = { success: false, message: text || "Respuesta no válida del servidor." }; }
  if (/Request Entity Too Large|FUNCTION_PAYLOAD_TOO_LARGE/i.test(text) || response.status === 413) {
    throw new Error("El ZIP es demasiado grande para enviarlo directamente al servidor. La carga debe hacerse mediante Supabase Storage.");
  }
  if (!data || typeof data !== "object") throw new Error("Respuesta no válida del servidor.");
  if (!response.ok || data.success === false) throw new Error(String(data.message || data.error || "No se pudo completar la carga."));
  return data;
}
