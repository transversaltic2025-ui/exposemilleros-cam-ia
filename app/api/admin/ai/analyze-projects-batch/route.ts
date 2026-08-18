import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { analyzeAndSaveProject } from "@/lib/ai/project-analysis-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 75;
const requestSchema = z.union([
  z.object({ action: z.literal("reset-stuck") }),
  z.object({ mode: z.enum(["pending", "all", "failed"]), limit: z.coerce.number().int().min(1).max(2).default(1), offset: z.coerce.number().int().min(0).default(0) }),
]);

async function metrics(db: ReturnType<typeof createSupabaseServerClient>) {
  const [totalResult, analyzedResult, errorsResult] = await Promise.all([
    db.from("proyectos").select("id", { count: "exact", head: true }),
    db.from("proyectos").select("id", { count: "exact", head: true }).eq("estado_analisis_ia", "Completado"),
    db.from("proyectos").select("id", { count: "exact", head: true }).eq("estado_analisis_ia", "Error"),
  ]);
  return { total: totalResult.count ?? 0, analyzed: analyzedResult.count ?? 0, errors: errorsResult.count ?? 0 };
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  try {
    const values = requestSchema.parse(await request.json());
    const db = createSupabaseServerClient();
    if ("action" in values) {
      const states = ["Procesando", "En proceso", "Analizando", "En análisis"];
      const { data, error } = await db.from("proyectos").update({ estado_analisis_ia: "Pendiente" }).in("estado_analisis_ia", states).select("id");
      if (error) throw error;
      return NextResponse.json({ success: true, reset: data?.length ?? 0, ...(await metrics(db)), message: "Análisis bloqueados restablecidos a Pendiente." });
    }

    const { mode, limit, offset } = values;
    let query = db.from("proyectos").select("*", { count: "exact" }).order("created_at", { ascending: true });
    if (mode === "failed") query = query.eq("estado_analisis_ia", "Error");
    if (mode === "pending") query = query.or("estado_analisis_ia.is.null,estado_analisis_ia.in.(Pendiente,Error)");
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    const results = await Promise.all((data ?? []).map((project) => analyzeAndSaveProject(db, project as Record<string, unknown>, { timeoutMs: 60_000 })));
    const completed = results.filter((result) => result.success).length;
    const pausedResult = results.find((result) => !result.success && "paused" in result && result.paused);
    const failed = results.filter((result) => !result.success && !("paused" in result && result.paused)).length;
    const processed = completed + failed;
    const nextOffset = mode === "pending" ? offset + failed : offset + processed;

    let remaining = Math.max((count ?? processed) - nextOffset, 0);
    if (mode !== "all") {
      const pendingQuery = mode === "failed"
        ? db.from("proyectos").select("id", { count: "exact", head: true }).eq("estado_analisis_ia", "Error")
        : db.from("proyectos").select("id", { count: "exact", head: true }).or("estado_analisis_ia.is.null,estado_analisis_ia.in.(Pendiente,Error)");
      const pendingResult = await pendingQuery;
      if (pendingResult.error) throw pendingResult.error;
      remaining = Math.max((pendingResult.count ?? 0) - nextOffset, 0);
    }

    const currentMetrics = await metrics(db);
    const logs = results.flatMap((result) => [
      `Analizando ${result.projectCode}`,
      result.success ? `Completado ${result.projectCode}` : "paused" in result && result.paused ? `Pausado ${result.projectCode}: ${result.error}` : `Error ${result.projectCode}: ${result.error}`,
    ]);
    const rateLimited = Boolean(pausedResult);
    return NextResponse.json({ success: true, processed, completed, failed, remaining, nextOffset, ...currentMetrics, lastProject: results.at(-1)?.projectCode ?? null, rateLimited, errorType: pausedResult ? "OPENROUTER_RATE_LIMIT" : null, logs, message: pausedResult ? "Se alcanzó el límite diario de OpenRouter para modelos gratuitos." : "Lote procesado correctamente." });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "No se pudo procesar el lote." }, { status: 500 });
  }
}
