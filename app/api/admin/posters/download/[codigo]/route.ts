import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { downloadPoster, getPosterFileName, type PosterProject } from "@/lib/posters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  const { codigo } = await params;
  const { data, error } = await createSupabaseServerClient().from("proyectos")
    .select("id,codigo_proyecto,nombre_proyecto,poster_proyecto_path,poster_proyecto_nombre,poster_proyecto_tipo")
    .eq("codigo_proyecto", codigo).maybeSingle();
  if (error) return NextResponse.json({ success: false, message: "No fue posible consultar el proyecto." }, { status: 500 });
  if (!data?.poster_proyecto_path) return NextResponse.json({ success: false, message: "Este proyecto no tiene póster cargado." }, { status: 404 });
  try {
    const project = data as PosterProject;
    const file = await downloadPoster(project.poster_proyecto_path);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": project.poster_proyecto_tipo || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(getPosterFileName(project))}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (downloadError) {
    console.error("[posters/download] error", downloadError);
    return NextResponse.json({ success: false, message: "No fue posible descargar el póster." }, { status: 404 });
  }
}
