import { NextResponse } from "next/server";
import { documentBelongsToProject, EDIT_ACCESS_ERROR, editableProject } from "@/lib/project-edit";
import { getProjectByCodigo, getProjectMembers } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProjectEditingEnabled, PROJECT_EDITING_CLOSED_MESSAGE } from "@/lib/system-config";

export async function POST(request: Request) {
  try {
    if (!(await isProjectEditingEnabled())) return NextResponse.json({ error: PROJECT_EDITING_CLOSED_MESSAGE }, { status: 403 });
    const body = await request.json() as { codigo_proyecto?: string; documento?: string };
    const codigo = body.codigo_proyecto?.trim();
    if (!codigo || !body.documento) return NextResponse.json({ error: EDIT_ACCESS_ERROR }, { status: 404 });
    const project = await getProjectByCodigo(codigo);
    if (!project?.id) return NextResponse.json({ error: EDIT_ACCESS_ERROR }, { status: 404 });
    const members = await getProjectMembers(project.id);
    if (!documentBelongsToProject(project, members, body.documento)) {
      return NextResponse.json({ error: EDIT_ACCESS_ERROR }, { status: 404 });
    }
    const { count } = await createSupabaseServerClient().from("evaluaciones").select("id", { count: "exact", head: true }).eq("proyecto_id", project.id);
    return NextResponse.json({ project: editableProject(project, members, Boolean(count)) });
  } catch (error) {
    console.error("[projects/edit-access]", error);
    return NextResponse.json({ error: "No fue posible validar el acceso en este momento." }, { status: 500 });
  }
}
