import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  EVALUATOR_REGISTRATION_CONFIG_KEY, isEvaluatorRegistrationEnabled, isProjectEditingEnabled,
  isProjectRegistrationEnabled, PROJECT_EDITING_CONFIG_KEY, PROJECT_REGISTRATION_CONFIG_KEY,
  setSystemConfigValue,
} from "@/lib/system-config";

const schema = z.object({
  projectRegistrationEnabled: z.boolean().optional(),
  projectEditingEnabled: z.boolean().optional(),
  evaluatorRegistrationEnabled: z.boolean().optional(),
}).refine((value) => Object.values(value).some((item) => item !== undefined), "Debe enviar al menos un estado.");

function unauthorized() { return NextResponse.json({ error: "No autorizado." }, { status: 401 }); }
async function state() {
  const [projectRegistrationEnabled, projectEditingEnabled, evaluatorRegistrationEnabled] = await Promise.all([
    isProjectRegistrationEnabled(), isProjectEditingEnabled(), isEvaluatorRegistrationEnabled(),
  ]);
  return { projectRegistrationEnabled, projectEditingEnabled, evaluatorRegistrationEnabled };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  return NextResponse.json(await state());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Los estados enviados no son válidos." }, { status: 400 });
  try {
    const updates: Promise<string>[] = [];
    if (parsed.data.projectRegistrationEnabled !== undefined) updates.push(setSystemConfigValue(PROJECT_REGISTRATION_CONFIG_KEY, String(parsed.data.projectRegistrationEnabled)));
    if (parsed.data.projectEditingEnabled !== undefined) updates.push(setSystemConfigValue(PROJECT_EDITING_CONFIG_KEY, String(parsed.data.projectEditingEnabled)));
    if (parsed.data.evaluatorRegistrationEnabled !== undefined) updates.push(setSystemConfigValue(EVALUATOR_REGISTRATION_CONFIG_KEY, String(parsed.data.evaluatorRegistrationEnabled)));
    await Promise.all(updates);
    const current = await state();
    const allEnabled = current.projectRegistrationEnabled && current.projectEditingEnabled && current.evaluatorRegistrationEnabled;
    const allDisabled = !current.projectRegistrationEnabled && !current.projectEditingEnabled && !current.evaluatorRegistrationEnabled;
    return NextResponse.json({ ...current, message: allEnabled ? "Los módulos públicos de inscripción fueron activados correctamente." : allDisabled ? "Los módulos públicos de inscripción fueron cerrados correctamente." : "La configuración de módulos públicos fue actualizada correctamente." });
  } catch (error) {
    console.error("[admin/public-modules]", error);
    return NextResponse.json({ error: "No fue posible actualizar los módulos públicos." }, { status: 500 });
  }
}
