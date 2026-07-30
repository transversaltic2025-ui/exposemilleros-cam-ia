import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  AUTOMATIC_PROJECT_ASSIGNMENT_CONFIG_KEY,
  setSystemConfigValue,
} from "@/lib/system-config";

const schema = z.object({ enabled: z.boolean() });

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "El estado enviado no es válido." }, { status: 400 });
  }

  try {
    await setSystemConfigValue(
      AUTOMATIC_PROJECT_ASSIGNMENT_CONFIG_KEY,
      String(parsed.data.enabled),
    );
    return NextResponse.json({ success: true, enabled: parsed.data.enabled });
  } catch (error) {
    console.error("[admin/settings/asignacion-proyectos]", error);
    return NextResponse.json(
      { error: "No fue posible actualizar la asignación automática." },
      { status: 500 },
    );
  }
}
