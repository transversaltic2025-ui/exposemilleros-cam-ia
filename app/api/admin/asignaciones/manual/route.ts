import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createManualAssignment } from "@/lib/manual-assignments";

const schema = z.object({
  proyecto_id: z.string().uuid().optional(),
  codigo_proyecto: z.string().trim().min(1).max(80).optional(),
  evaluador_id: z.string().uuid(),
}).refine((value) => Boolean(value.proyecto_id || value.codigo_proyecto), {
  message: "Debe indicar proyecto_id o codigo_proyecto.",
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Proyecto o evaluador inválido." }, { status: 400 });
  try {
    return NextResponse.json({
      asignacion: await createManualAssignment({
        projectId: parsed.data.proyecto_id,
        projectCode: parsed.data.codigo_proyecto,
        evaluatorId: parsed.data.evaluador_id,
      }),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible crear la asignación." }, { status: 409 });
  }
}
