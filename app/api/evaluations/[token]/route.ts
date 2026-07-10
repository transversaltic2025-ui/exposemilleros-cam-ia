import { NextResponse } from "next/server";
import { z } from "zod";

import { getEvaluationByToken, saveHumanEvaluation, shouldUseMockData } from "@/lib/supabase/queries";

const schema = z.object({
  archivo_abierto: z.coerce.boolean().refine(Boolean),
  puntaje_pertinencia: z.coerce.number().min(0).max(20).optional(),
  puntaje_innovacion: z.coerce.number().min(0).max(20).optional(),
  puntaje_metodologia: z.coerce.number().min(0).max(20).optional(),
  puntaje_impacto: z.coerce.number().min(0).max(20).optional(),
  puntaje_comunicacion: z.coerce.number().min(0).max(20).optional(),
  observaciones: z.string().min(10).optional(),
  fortalezas: z.string().min(10),
  oportunidades: z.string().min(10).optional(),
  oportunidades_mejora: z.string().min(10).optional(),
  recomendacion_final: z.string().optional().nullable(),
  concepto_evaluador: z.string().min(20),
  detalles: z.array(z.object({
    criterio_id: z.string().min(1),
    puntaje: z.coerce.number().min(0),
    observacion_criterio: z.string().optional(),
  })).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    console.log("[api/evaluations] token_evaluacion recibido", token);
    const body = await request.json();
    const values = schema.parse(body);
    if (shouldUseMockData()) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
      return NextResponse.json(
        {
          evaluation: {
            evaluacion_id: "EVA-MOCK",
            token,
            ...values,
          },
          success: true,
          evaluatorAccessUrl: `${appUrl}/evaluadores/mis-asignaciones/mock-evaluator-token`,
          message: "Evaluación registrada correctamente.",
        },
        { status: 201 },
      );
    }

    const current = await getEvaluationByToken(token);
    console.log("[api/evaluations] asignación encontrada", current.asignacion);
    console.log("[api/evaluations] evaluador encontrado", current.evaluador ? {
      id: current.evaluador.id,
      codigo_evaluador: current.evaluador.codigo_evaluador,
    } : null);
    console.log("[api/evaluations] token_acceso del evaluador", current.evaluador?.token_acceso ? "disponible" : "faltante");

    const evaluation = await saveHumanEvaluation(token, values);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const evaluatorAccessUrl = current.evaluador?.token_acceso
      ? `${appUrl}/evaluadores/mis-asignaciones/${current.evaluador.token_acceso}`
      : "";
    console.log("[api/evaluations] URL de retorno generada", evaluatorAccessUrl);

    return NextResponse.json({
      success: true,
      evaluation,
      evaluatorAccessUrl,
      message: "Evaluación registrada correctamente.",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la evaluación.";
    console.error("[api/evaluations] error exacto", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
