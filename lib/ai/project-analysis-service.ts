import { analyzeProjectTrends } from "@/lib/ai/trend-analysis";
import { isOpenRouterRateLimitError } from "@/lib/ai/openrouter";
import { PROJECT_FILES_BUCKET } from "@/lib/supabase/storage";
import type { Project, ProjectMember } from "@/types";

type DbClient = ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>;

const arrays = ["tendencias_identificadas", "palabras_clave_ia", "sectores_relacionados", "riesgos_detectados", "oportunidades_detectadas", "brechas_genero_ia", "acciones_genero_recomendadas_ia", "riesgos_exclusion_ia", "oportunidades_inclusion_ia"] as const;

function message(error: unknown) {
  if (error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"))) return "Tiempo de espera agotado durante el análisis IA.";
  if (error instanceof Error) return error.message.slice(0, 1200);
  if (typeof error === "string") return error.slice(0, 1200);
  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    const parts = [value.message, value.code && `code=${value.code}`, value.details && `details=${value.details}`, value.hint && `hint=${value.hint}`, value.status && `status=${value.status}`].filter(Boolean);
    if (parts.length) return parts.join(" | ").slice(0, 1200);
    try { return JSON.stringify(error).slice(0, 1200); } catch { return String(error).slice(0, 1200); }
  }
  return `Error sin detalle técnico (${String(error)}).`;
}

async function latestAnalysisId(client: DbClient, projectId: string) {
  const { data, error } = await client.from("analisis_ia").select("*").eq("proyecto_id", projectId);
  if (error) throw error;
  const latest = (data ?? []).sort((a, b) => {
    const left = Date.parse(String(a.fecha_analisis || a.created_at || "")) || 0;
    const right = Date.parse(String(b.fecha_analisis || b.created_at || "")) || 0;
    return right - left;
  })[0];
  return latest?.id as string | undefined;
}

async function save(client: DbClient, projectId: string, payload: Record<string, unknown>) {
  const id = await latestAnalysisId(client, projectId);
  const query = id ? client.from("analisis_ia").update(payload).eq("id", id) : client.from("analisis_ia").insert({ proyecto_id: projectId, ...payload });
  const { error } = await query;
  if (error) throw error;
}

export async function analyzeAndSaveProject(client: DbClient, projectRow: Record<string, unknown>, options: { timeoutMs?: number } = {}) {
  const projectId = String(projectRow.id);
  const projectCode = String(projectRow.codigo_proyecto || projectRow.codigo || projectId);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);
  await client.from("proyectos").update({ estado_analisis_ia: "Procesando" }).eq("id", projectId);
  try {
    const { data: memberRows, error: membersError } = await client.from("proyecto_integrantes").select("rol_integrante,nombre_completo").eq("proyecto_id", projectId).order("orden");
    if (membersError) throw membersError;
    const path = String(projectRow.archivo_proyecto_path || projectRow.archivo_storage_path || "");
    let file;
    if (path) {
      const { data, error } = await client.storage.from(PROJECT_FILES_BUCKET).download(path);
      if (error) throw new Error(`No fue posible abrir el archivo del proyecto: ${error.message}`);
      file = { filename: String(projectRow.archivo_proyecto_nombre || path.split("/").pop() || "proyecto.pdf"), mimeType: String(projectRow.archivo_proyecto_tipo || data.type || "application/pdf"), bytes: await data.arrayBuffer() };
    }
    const analysis = await analyzeProjectTrends({ ...(projectRow as unknown as Project), equipo: (memberRows ?? []) as ProjectMember[] }, file, controller.signal);
    const payload: Record<string, unknown> = { ...analysis, fecha_analisis: new Date().toISOString() };
    for (const field of arrays) payload[field] = Array.isArray(payload[field]) ? payload[field] : [];
    await save(client, projectId, payload);
    await client.from("proyectos").update({ estado_analisis_ia: "Completado" }).eq("id", projectId);
    return { success: true as const, projectCode };
  } catch (error) {
    if (isOpenRouterRateLimitError(error)) {
      await client.from("proyectos").update({ estado_analisis_ia: "Pendiente" }).eq("id", projectId);
      return { success: false as const, paused: true as const, type: error.type, error: error.message, projectCode, rateLimited: true as const };
    }
    const detail = message(error);
    await client.from("proyectos").update({ estado_analisis_ia: "Error" }).eq("id", projectId);
    try { await save(client, projectId, { estado_analisis: "Error", mensaje_error: detail, modelo_ia: process.env.OPENROUTER_MODEL || "openrouter/fallback", fecha_analisis: new Date().toISOString() }); } catch (saveError) { console.error("[ai/service] no se guardó el error", message(saveError)); }
    return { success: false as const, error: detail, projectCode, rateLimited: /429|rate limit|limitando/i.test(detail) };
  } finally {
    clearTimeout(timeout);
  }
}
