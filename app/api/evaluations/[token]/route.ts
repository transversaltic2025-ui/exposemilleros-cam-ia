import { NextResponse } from "next/server";
import { z } from "zod";

import { saveHumanEvaluation, shouldUseMockData } from "@/lib/supabase/queries";

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
  recomendacion_final: z.enum(["Destacado", "Aprobar", "Ajustar", "No recomendado"]),
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
    console.log("[api/evaluations] token recibido", token);
    const body = await request.json();
    const values = schema.parse(body);
    if (shouldUseMockData()) {
      return NextResponse.json(
        {
          evaluation: {
            evaluacion_id: "EVA-MOCK",
            token,
            ...values,
          },
        },
        { status: 201 },
      );
    }

    const evaluation = await saveHumanEvaluation(token, values);

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la evaluacion.";
    console.error("[api/evaluations] error exacto", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
