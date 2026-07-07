import { NextResponse } from "next/server";
import { z } from "zod";

import { createEvaluatorAndAssignments, shouldUseMockData } from "@/lib/supabase/queries";

const schema = z.object({
  nombre_evaluador: z.string().min(3),
  documento_evaluador: z.string().min(5),
  correo_evaluador: z.string().email(),
  celular_evaluador: z.string().min(7),
  institucion_evaluador: z.string().min(2),
  area_conocimiento: z.string().min(1),
});

function textAlias(data: Record<string, FormDataEntryValue>, names: string[]) {
  for (const name of names) {
    const value = data[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawValues = Object.fromEntries(formData.entries());
    const values = schema.parse({
      nombre_evaluador: textAlias(rawValues, ["nombre_evaluador", "nombre"]),
      documento_evaluador: textAlias(rawValues, ["documento_evaluador", "documento"]),
      correo_evaluador: textAlias(rawValues, ["correo_evaluador", "correo"]),
      celular_evaluador: textAlias(rawValues, ["celular_evaluador", "celular"]),
      institucion_evaluador: textAlias(rawValues, ["institucion_evaluador", "entidad"]),
      area_conocimiento: textAlias(rawValues, ["area_conocimiento"]),
    });
    if (shouldUseMockData()) {
      const tokenAcceso = "mock-evaluator-token";
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const evaluator = {
        ...values,
        id: "EVAL-MOCK",
        codigo_evaluador: "EVAL-2026-0001",
        estado_evaluador: "Activo",
        cantidad_proyectos_asignados: 0,
        token_acceso: tokenAcceso,
      };
      return NextResponse.json(
        {
          success: true,
          evaluator,
          evaluador: evaluator,
          assignments: [],
          assignmentsCount: 0,
          evaluatorAccessUrl: `${appUrl}/evaluadores/mis-asignaciones/${tokenAcceso}`,
          message: "Tu registro fue creado, pero no hay proyectos disponibles para tu area en este momento.",
        },
        { status: 201 },
      );
    }

    const result = await createEvaluatorAndAssignments(values);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el evaluador.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
