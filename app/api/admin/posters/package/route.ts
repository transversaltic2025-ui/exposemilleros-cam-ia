import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createPostersZip, type PosterProject } from "@/lib/posters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const bodySchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1).max(200),
  kind: z.enum(["seleccionados", "filtrados"]).optional(),
});
const fields = "id,codigo_proyecto,nombre_proyecto,poster_proyecto_path,poster_proyecto_nombre,poster_proyecto_tipo";
const notFound = () => NextResponse.json({ success: false, message: "No se encontraron pósters disponibles para descargar." }, { status: 404 });
const zipResponse = (zip: Buffer, filename: string) => new NextResponse(new Uint8Array(zip), {
  headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  },
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, message: "La selección de proyectos no es válida." }, { status: 400 });
    const { data, error } = await createSupabaseServerClient().from("proyectos").select(fields)
      .in("id", parsed.data.projectIds).not("poster_proyecto_path", "is", null);
    if (error) throw error;
    const projects = ((data || []) as PosterProject[]).filter(item => item.poster_proyecto_path);
    if (!projects.length) return notFound();
    const zip = await createPostersZip(projects);
    if (!zip) return notFound();
    return zipResponse(zip, parsed.data.kind === "filtrados" ? "posters-filtrados.zip" : "posters-seleccionados.zip");
  } catch (error) {
    console.error("[posters/package POST] error", error);
    return NextResponse.json({ success: false, message: "No fue posible generar el paquete de pósters." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams;
    const offset = Math.max(0, Number.parseInt(params.get("offset") || "0", 10) || 0);
    const limit = Math.min(20, Math.max(1, Number.parseInt(params.get("limit") || "20", 10) || 20));
    const { data, error } = await createSupabaseServerClient().from("proyectos").select(fields)
      .not("poster_proyecto_path", "is", null).order("created_at", { ascending: true }).range(offset, offset + limit - 1);
    if (error) throw error;
    const projects = ((data || []) as PosterProject[]).filter(item => item.poster_proyecto_path);
    if (!projects.length) return notFound();
    const zip = await createPostersZip(projects);
    if (!zip) return notFound();
    const packageNumber = Math.floor(offset / 20) + 1;
    return zipResponse(zip, `posters-paquete-${packageNumber}.zip`);
  } catch (error) {
    console.error("[posters/package GET] error", error);
    return NextResponse.json({ success: false, message: "No fue posible generar el paquete de pósters." }, { status: 500 });
  }
}
