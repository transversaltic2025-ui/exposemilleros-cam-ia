import { NextResponse } from "next/server";
import { z } from "zod";

import { getColombiaDateString } from "@/lib/event-config";
import { createEvaluatorAndAssignments, shouldUseMockData } from "@/lib/supabase/queries";
import {
  EVALUATOR_REGISTRATION_CLOSED_MESSAGE,
  isEvaluatorRegistrationEnabled,
} from "@/lib/system-config";

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
    if (!(await isEvaluatorRegistrationEnabled())) return NextResponse.json({ error: EVALUATOR_REGISTRATION_CLOSED_MESSAGE }, { status: 403 });
    const now = new Date();
    const assignmentOpen = true;
    console.info("[evaluators/register] registro de evaluador recibido", {
      currentDate: getColombiaDateString(now),
      assignmentOpen,
    });

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
          asignaciones: [],
          assignmentsCount: 0,
          cantidad_proyectos_asignados: 0,
          evaluatorAccessUrl: `${appUrl}/evaluadores/mis-asignaciones/${tokenAcceso}`,
          assignmentOpen,
          message: assignmentOpen
            ? "Tu registro fue creado, pero no hay proyectos disponibles para tu area en este momento."
            : "Registro recibido correctamente. La asignaci?n autom?tica est? desactivada.",
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
