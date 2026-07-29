import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createParticipantsWorkbook } from "@/lib/project-admin-exports";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const schema = z.object({ projectIds: z.array(z.string().uuid()).max(500) });
const projectFields = "id,codigo_proyecto,nombre_proyecto,semillero,semillero_otro,linea_tematica,municipio,modalidad_participacion,estado_proyecto,categoria_presentacion,created_at";
const memberFields = "proyecto_id,rol_integrante,nombre_completo,documento,correo,celular,ficha,es_menor_edad,tratamiento_datos_menor_path";

async function generate(projectIds?: string[]) {
  const client = createSupabaseServerClient();
  let projectsQuery = client.from("proyectos").select(projectFields).order("created_at", { ascending: false });
  if (projectIds) projectsQuery = projectsQuery.in("id", projectIds);
  const { data: projects, error: projectsError } = await projectsQuery;
  if (projectsError) throw projectsError;
  const ids = (projects || []).map(project => project.id);
  const { data: members, error: membersError } = ids.length
    ? await client.from("proyecto_integrantes").select(memberFields).in("proyecto_id", ids).order("orden", { ascending: true })
    : { data: [], error: null };
  if (membersError) throw membersError;
  return createParticipantsWorkbook(projects || [], members || []);
}

function response(excel: Awaited<ReturnType<typeof generate>>, filename: string) {
  return new NextResponse(new Uint8Array(excel), { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  } });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try { return response(await generate(), "participantes-por-proyecto.xlsx"); }
  catch (error) {
    console.error("[projects/participants/export GET] error", error);
    return NextResponse.json({ error: "No fue posible generar la base de participantes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "La selección de proyectos no es válida." }, { status: 400 });
    return response(await generate(parsed.data.projectIds), "participantes-proyectos-filtrados.xlsx");
  } catch (error) {
    console.error("[projects/participants/export POST] error", error);
    return NextResponse.json({ error: "No fue posible generar la base de participantes." }, { status: 500 });
  }
}
