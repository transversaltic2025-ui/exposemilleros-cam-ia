import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { analyzeProjectTrends } from "@/lib/ai/trend-analysis";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project } from "@/types";

const schema = z.object({
  proyecto_id: z.string().min(1),
});

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo analizar el proyecto.";
}

function safeStringArray(values: unknown) {
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
}

async function saveErrorAnalysis(proyectoId: string, message: string) {
  const client = createSupabaseServerClient();
  const payload = {
    proyecto_id: proyectoId,
    resumen_ia: "",
    tendencias_identificadas: [],
    palabras_clave_ia: [],
    sectores_relacionados: [],
    riesgos_detectados: [],
    oportunidades_detectadas: [],
    enfoque_genero_ia: "",
    nivel_inclusion_genero_ia: 0,
    recomendaciones_genero_ia: [],
    enfoque_etnico_ia: "",
    nivel_inclusion_etnica_ia: 0,
    recomendaciones_etnicas_ia: [],
    enfoque_diferencial_ia: "",
    riesgos_exclusion_ia: [],
    oportunidades_inclusion_ia: [],
    puntaje_sugerido_ia: null,
    nivel_tendencia_ia: "No disponible",
    concepto_ia: "",
    alertas_calidad: [],
    estado_analisis: "Error",
    mensaje_error: message,
    modelo_ia: process.env.OPENROUTER_MODEL || "openrouter/free",
  };

  const { data: existingAnalysis, error: existingError } = await client
    .from("analisis_ia")
    .select("id")
    .eq("proyecto_id", proyectoId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("[ai/analyze-project] error exacto buscando analisis fallido existente", existingError);
    return;
  }

  const { error } = existingAnalysis?.id
    ? await client.from("analisis_ia").update(payload).eq("id", existingAnalysis.id)
    : await client.from("analisis_ia").insert(payload);

  if (error) {
    console.error("[ai/analyze-project] error exacto guardando mensaje_error", error);
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    console.warn("[ai/analyze-project] analisis IA no autorizado");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  console.log("[ai/analyze-project] analisis IA autorizado");

  const client = createSupabaseServerClient();
  let proyectoId = "";

  try {
    const body = await request.json();
    const values = schema.parse(body);
    proyectoId = values.proyecto_id;
    console.log("[ai/analyze-project] proyecto_id recibido", proyectoId);

    const { data: projectRow, error: projectError } = await client
      .from("proyectos")
      .select("*")
      .eq("id", proyectoId)
      .maybeSingle();

    if (projectError) {
      console.error("[ai/analyze-project] error exacto buscando proyecto", projectError);
      throw projectError;
    }
    if (!projectRow) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }

    const { error: processingError } = await client
      .from("proyectos")
      .update({ estado_analisis_ia: "Procesando" })
      .eq("id", proyectoId);

    if (processingError) {
      console.error("[ai/analyze-project] error exacto marcando Procesando", processingError);
      throw processingError;
    }

    const analysis = await analyzeProjectTrends(projectRow as Project);
    const payload = {
      proyecto_id: proyectoId,
      ...analysis,
      tendencias_identificadas: safeStringArray(analysis.tendencias_identificadas),
      palabras_clave_ia: safeStringArray(analysis.palabras_clave_ia),
      sectores_relacionados: safeStringArray(analysis.sectores_relacionados),
      riesgos_detectados: safeStringArray(analysis.riesgos_detectados),
      oportunidades_detectadas: safeStringArray(analysis.oportunidades_detectadas),
      recomendaciones_genero_ia: safeStringArray(analysis.recomendaciones_genero_ia),
      recomendaciones_etnicas_ia: safeStringArray(analysis.recomendaciones_etnicas_ia),
      riesgos_exclusion_ia: safeStringArray(analysis.riesgos_exclusion_ia),
      oportunidades_inclusion_ia: safeStringArray(analysis.oportunidades_inclusion_ia),
    };

    const { data: existingAnalysis, error: existingError } = await client
      .from("analisis_ia")
      .select("id")
      .eq("proyecto_id", proyectoId)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("[ai/analyze-project] error exacto buscando analisis existente", existingError);
      throw existingError;
    }

    const saveQuery = existingAnalysis?.id
      ? client.from("analisis_ia").update(payload).eq("id", existingAnalysis.id).select("*").single()
      : client.from("analisis_ia").insert(payload).select("*").single();

    const { data: savedAnalysis, error: saveError } = await saveQuery;
    if (saveError) {
      console.error("[ai/analyze-project] error exacto guardando analisis IA", saveError);
      throw saveError;
    }

    const { error: completedError } = await client
      .from("proyectos")
      .update({ estado_analisis_ia: "Completado" })
      .eq("id", proyectoId);

    if (completedError) {
      console.error("[ai/analyze-project] error exacto marcando Completado", completedError);
      throw completedError;
    }

    console.log("[ai/analyze-project] analisis guardado correctamente", savedAnalysis);
    return NextResponse.json({ success: true, analysis: savedAnalysis });
  } catch (error) {
    const message = errorMessage(error);
    console.error("[ai/analyze-project] error exacto", error);

    if (proyectoId) {
      await client.from("proyectos").update({ estado_analisis_ia: "Error" }).eq("id", proyectoId);
      await saveErrorAnalysis(proyectoId, message);
    }

    return NextResponse.json(
      {
        error: "No fue posible generar el analisis IA. Intenta nuevamente en unos minutos.",
        detail: message,
      },
      { status: 500 },
    );
  }
}
