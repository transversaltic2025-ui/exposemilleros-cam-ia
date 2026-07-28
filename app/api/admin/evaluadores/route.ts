import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminEvaluator } from "@/lib/manual-assignments";

const schema = z.object({
  nombre_evaluador: z.string().trim().min(3).max(160),
  documento_evaluador: z.string().trim().min(4).max(40),
  correo_evaluador: z.string().trim().email().max(200),
  celular_evaluador: z.string().trim().min(7).max(30),
  area_conocimiento: z.string().trim().min(2).max(160),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos del evaluador inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await createAdminEvaluator(parsed.data);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible guardar el evaluador." }, { status: 500 });
  }
}
