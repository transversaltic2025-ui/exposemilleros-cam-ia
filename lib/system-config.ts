import { createSupabaseServerClient } from "@/lib/supabase/server";

export const PROJECT_EDITING_CONFIG_KEY = "edicion_inscripciones_habilitada";
export const PROJECT_REGISTRATION_CONFIG_KEY = "inscripcion_proyectos_habilitada";
export const EVALUATOR_REGISTRATION_CONFIG_KEY = "registro_evaluadores_habilitado";
export const PROJECT_EDITING_CLOSED_MESSAGE = "La edición pública de inscripciones se encuentra cerrada.";
export const PROJECT_REGISTRATION_CLOSED_MESSAGE = "La inscripción pública de proyectos se encuentra cerrada.";
export const EVALUATOR_REGISTRATION_CLOSED_MESSAGE = "El registro público de evaluadores se encuentra cerrado.";

export async function getSystemConfigValue(key: string) {
  try {
    const { data, error } = await createSupabaseServerClient()
      .from("sistema_configuracion")
      .select("valor")
      .eq("clave", key)
      .maybeSingle();
    if (error) throw error;
    return typeof data?.valor === "string" ? data.valor : null;
  } catch (error) {
    console.error(`[system-config] No se pudo leer ${key}`, error);
    return null;
  }
}

export async function isProjectEditingEnabled() {
  return (await getSystemConfigValue(PROJECT_EDITING_CONFIG_KEY))?.trim().toLowerCase() === "true";
}

export async function isProjectRegistrationEnabled() {
  return (await getSystemConfigValue(PROJECT_REGISTRATION_CONFIG_KEY))?.trim().toLowerCase() === "true";
}

export async function isEvaluatorRegistrationEnabled() {
  return (await getSystemConfigValue(EVALUATOR_REGISTRATION_CONFIG_KEY))?.trim().toLowerCase() === "true";
}

export async function setSystemConfigValue(key: string, value: string) {
  const { data, error } = await createSupabaseServerClient()
    .from("sistema_configuracion")
    .upsert({ clave: key, valor: value, updated_at: new Date().toISOString() }, { onConflict: "clave" })
    .select("valor")
    .single();
  if (error) throw error;
  return data.valor as string;
}
