import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { analyzeAndSaveProject } from "@/lib/ai/project-analysis-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ proyecto_id: z.string().min(1) });

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { proyecto_id } = schema.parse(await request.json());
    const db = createSupabaseServerClient();
    const { data: project, error } = await db.from("proyectos").select("*").eq("id", proyecto_id).maybeSingle();
    if (error) throw error;
    if (!project) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    const result = await analyzeAndSaveProject(db, project as Record<string, unknown>);
    return result.success ? NextResponse.json({ success: true }) : NextResponse.json({ error: "No fue posible generar el análisis IA.", detail: result.error }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: "No fue posible generar el análisis IA.", detail: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}
