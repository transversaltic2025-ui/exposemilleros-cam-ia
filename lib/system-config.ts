import { createSupabaseServerClient } from "@/lib/supabase/server";

export const PROJECT_EDITING_CONFIG_KEY = "edicion_inscripciones_habilitada";
export const PROJECT_REGISTRATION_CONFIG_KEY = "inscripcion_proyectos_habilitada";
export const EVALUATOR_REGISTRATION_CONFIG_KEY = "registro_evaluadores_habilitado";
export const AUTOMATIC_PROJECT_ASSIGNMENT_CONFIG_KEY = "asignacion_proyectos_habilitada";
export const PRODUCERS_REGISTRATION_CONFIG_KEY = "productores_inscripcion_habilitada";
export const YOUNG_ENTREPRENEURS_REGISTRATION_CONFIG_KEY = "jovenes_emprendedores_inscripcion_habilitada";
export const PROJECT_EDITING_CLOSED_MESSAGE = "La edición pública de inscripciones se encuentra cerrada.";
export const PROJECT_REGISTRATION_CLOSED_MESSAGE = "La inscripción pública de proyectos se encuentra cerrada.";
export const EVALUATOR_REGISTRATION_CLOSED_MESSAGE = "El registro público de evaluadores de proyectos de investigación en modalidad póster está cerrado en este momento.";
export const PRODUCERS_REGISTRATION_CLOSED_MESSAGE = "La inscripción de productores campesinos se encuentra cerrada.";
export const YOUNG_ENTREPRENEURS_REGISTRATION_CLOSED_MESSAGE = "La inscripción de jóvenes emprendedores se encuentra cerrada.";

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

export async function isAutomaticProjectAssignmentEnabled() {
  const value = await getSystemConfigValue(AUTOMATIC_PROJECT_ASSIGNMENT_CONFIG_KEY);
  return value === null || value.trim().toLowerCase() === "true";
}

export async function isProducersRegistrationEnabled() {
  return (await getSystemConfigValue(PRODUCERS_REGISTRATION_CONFIG_KEY))?.trim().toLowerCase() === "true";
}

export async function isYoungEntrepreneursRegistrationEnabled() {
  return (await getSystemConfigValue(YOUNG_ENTREPRENEURS_REGISTRATION_CONFIG_KEY))?.trim().toLowerCase() === "true";
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

export async function ensurePublicModuleConfigKeys() {
  const rows = [
    PROJECT_REGISTRATION_CONFIG_KEY,
    PROJECT_EDITING_CONFIG_KEY,
    EVALUATOR_REGISTRATION_CONFIG_KEY,
    PRODUCERS_REGISTRATION_CONFIG_KEY,
    YOUNG_ENTREPRENEURS_REGISTRATION_CONFIG_KEY,
  ].map((clave) => ({ clave, valor: "true" }));
  const { error } = await createSupabaseServerClient()
    .from("sistema_configuracion")
    .upsert(rows, { onConflict: "clave", ignoreDuplicates: true });
  if (error) throw error;
}
