import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isProjectEditingEnabled, PROJECT_EDITING_CONFIG_KEY, setSystemConfigValue } from "@/lib/system-config";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  return NextResponse.json({ enabled: await isProjectEditingEnabled() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const parsed = z.object({ enabled: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "El estado enviado no es válido." }, { status: 400 });
  try {
    await setSystemConfigValue(PROJECT_EDITING_CONFIG_KEY, String(parsed.data.enabled));
    return NextResponse.json({
      enabled: parsed.data.enabled,
      message: parsed.data.enabled
        ? "La edición pública de inscripciones fue activada."
        : "La edición pública de inscripciones fue desactivada.",
    });
  } catch (error) {
    console.error("[admin/project-editing]", error);
    return NextResponse.json({ error: "No fue posible actualizar la configuración." }, { status: 500 });
  }
}
