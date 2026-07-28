import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  requiere_asignacion_manual: z.boolean(),
  cupo_evaluadores_manual: z.number().int().min(1).max(4),
  observaciones_asignacion_manual: z.string().max(1000).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de asignación inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { codigo } = await params;
  const payload = parsed.data.requiere_asignacion_manual
    ? { ...parsed.data, cupo_evaluadores_manual: 4 }
    : { ...parsed.data, cupo_evaluadores_manual: 2 };
  const { data, error } = await createSupabaseServerClient().from("proyectos")
    .update(payload).eq("codigo_proyecto", codigo).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  }
  return NextResponse.json({ proyecto: data });
}
