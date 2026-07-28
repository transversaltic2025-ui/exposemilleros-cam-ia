import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  EVALUATOR_REGISTRATION_CONFIG_KEY,
  ensurePublicModuleConfigKeys,
  isEvaluatorRegistrationEnabled,
  isProducersRegistrationEnabled,
  isProjectEditingEnabled,
  isProjectRegistrationEnabled,
  isYoungEntrepreneursRegistrationEnabled,
  PRODUCERS_REGISTRATION_CONFIG_KEY,
  PROJECT_EDITING_CONFIG_KEY,
  PROJECT_REGISTRATION_CONFIG_KEY,
  setSystemConfigValue,
  YOUNG_ENTREPRENEURS_REGISTRATION_CONFIG_KEY,
} from "@/lib/system-config";

const allowedKeys = [
  PROJECT_REGISTRATION_CONFIG_KEY,
  PROJECT_EDITING_CONFIG_KEY,
  EVALUATOR_REGISTRATION_CONFIG_KEY,
  PRODUCERS_REGISTRATION_CONFIG_KEY,
  YOUNG_ENTREPRENEURS_REGISTRATION_CONFIG_KEY,
] as const;
const schema = z.object({ key: z.enum(allowedKeys), enabled: z.boolean() });

const labels: Record<(typeof allowedKeys)[number], string> = {
  [PROJECT_REGISTRATION_CONFIG_KEY]: "La inscripción de proyectos",
  [PROJECT_EDITING_CONFIG_KEY]: "La edición de inscripciones",
  [EVALUATOR_REGISTRATION_CONFIG_KEY]: "El registro de evaluadores",
  [PRODUCERS_REGISTRATION_CONFIG_KEY]: "La inscripción de productores campesinos",
  [YOUNG_ENTREPRENEURS_REGISTRATION_CONFIG_KEY]: "La inscripción de jóvenes emprendedores",
};

function unauthorized() {
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}

async function state() {
  const [
    projectRegistrationEnabled,
    projectEditingEnabled,
    evaluatorRegistrationEnabled,
    producersRegistrationEnabled,
    youngEntrepreneursRegistrationEnabled,
  ] = await Promise.all([
    isProjectRegistrationEnabled(),
    isProjectEditingEnabled(),
    isEvaluatorRegistrationEnabled(),
    isProducersRegistrationEnabled(),
    isYoungEntrepreneursRegistrationEnabled(),
  ]);
  return {
    projectRegistrationEnabled,
    projectEditingEnabled,
    evaluatorRegistrationEnabled,
    producersRegistrationEnabled,
    youngEntrepreneursRegistrationEnabled,
  };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  await ensurePublicModuleConfigKeys();
  return NextResponse.json(await state());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "La clave o el estado enviado no es válido." }, { status: 400 });
  }
  try {
    await setSystemConfigValue(parsed.data.key, String(parsed.data.enabled));
    const feminine = parsed.data.key !== EVALUATOR_REGISTRATION_CONFIG_KEY;
    const action = parsed.data.enabled
      ? feminine ? "activada" : "activado"
      : feminine ? "desactivada" : "desactivado";
    return NextResponse.json({
      success: true,
      key: parsed.data.key,
      enabled: parsed.data.enabled,
      message: `${labels[parsed.data.key]} fue ${action} correctamente.`,
    });
  } catch (error) {
    console.error("[admin/public-modules]", error);
    return NextResponse.json({ error: "No fue posible actualizar el módulo público." }, { status: 500 });
  }
}
