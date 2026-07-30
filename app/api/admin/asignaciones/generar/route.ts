import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateAutomaticProjectAssignments } from "@/lib/supabase/queries";
import { isAutomaticProjectAssignmentEnabled } from "@/lib/system-config";

const schema = z.object({ mode: z.enum(["generate", "repair"]).optional() });

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!(await isAutomaticProjectAssignmentEnabled())) {
    return NextResponse.json(
      {
        error:
          "La asignación automática está desactivada. Actívela desde el panel administrativo para generar asignaciones.",
      },
      { status: 409 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "El modo de asignación no es válido." }, { status: 400 });
  }

  try {
    const mode = parsed.data.mode ?? "generate";
    const summary = await generateAutomaticProjectAssignments(mode);
    let message = "Asignación automática generada correctamente.";

    if (mode === "repair") {
      message = summary.evaluadoresReparados > 0
        ? "Asignaciones reparadas correctamente."
        : "No se encontraron evaluadores que pudieran ser reparados.";
    } else if (
      summary.proyectosProcesados === 0 ||
      summary.proyectosConDosEvaluadores === summary.proyectosProcesados
    ) {
      message = "No hay proyectos pendientes por asignar.";
    } else if (summary.evaluadoresActivos === 0 || summary.asignacionesCreadas === 0) {
      message = "No hay evaluadores disponibles para asignar nuevos proyectos.";
    }

    return NextResponse.json({ success: true, mode, message, ...summary });
  } catch (error) {
    console.error("[admin/asignaciones/generar]", error);
    return NextResponse.json(
      { error: "No fue posible generar las asignaciones automáticas." },
      { status: 500 },
    );
  }
}
