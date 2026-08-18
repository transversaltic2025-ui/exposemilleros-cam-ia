import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createManualAssignment } from "@/lib/manual-assignments";

const schema = z.object({
  proyectoId: z.string().uuid().optional(),
  evaluadorId: z.string().uuid().optional(),
  proyecto_id: z.string().uuid().optional(),
  evaluador_id: z.string().uuid().optional(),
  codigo_proyecto: z.string().trim().min(1).max(80).optional(),
}).transform((value) => ({
  projectId: value.proyectoId ?? value.proyecto_id,
  projectCode: value.codigo_proyecto,
  evaluatorId: value.evaluadorId ?? value.evaluador_id,
})).refine((value) => Boolean((value.projectId || value.projectCode) && value.evaluatorId), {
  message: "Debe indicar un proyecto y un evaluador.",
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.evaluatorId) {
    return NextResponse.json({ error: "Proyecto o evaluador inválido." }, { status: 400 });
  }
  try {
    const assignment = await createManualAssignment({
      projectId: parsed.data.projectId,
      projectCode: parsed.data.projectCode,
      evaluatorId: parsed.data.evaluatorId,
    });
    return NextResponse.json({
      success: true,
      message: "Evaluador asignado correctamente.",
      asignacion: assignment,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible crear la asignación." },
      { status: 409 },
    );
  }
}
