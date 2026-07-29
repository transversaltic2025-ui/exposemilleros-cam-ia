import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { addEvaluatorRows, createEvaluatorWorkbook } from "@/lib/evaluators-excel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const client = createSupabaseServerClient();
    const [{ data: evaluators, error: evaluatorsError }, { data: assignments, error: assignmentsError }] = await Promise.all([
      client.from("evaluadores").select("*").order("created_at", { ascending: false }),
      client.from("asignaciones").select("evaluador_id,estado_asignacion"),
    ]);
    if (evaluatorsError) throw evaluatorsError;
    if (assignmentsError) throw assignmentsError;

    const counts = new Map<string, { total: number; completed: number; pending: number }>();
    for (const assignment of assignments || []) {
      if (!assignment.evaluador_id) continue;
      const current = counts.get(assignment.evaluador_id) || { total: 0, completed: 0, pending: 0 };
      current.total += 1;
      if (assignment.estado_asignacion === "Completada") current.completed += 1;
      else current.pending += 1;
      counts.set(assignment.evaluador_id, current);
    }
    const { workbook, worksheet } = createEvaluatorWorkbook("Evaluadores proyectos", [
      { header: "Código evaluador", key: "codigo", width: 20 },
      { header: "Nombre evaluador", key: "nombre", width: 30 },
      { header: "Documento", key: "documento", width: 18 },
      { header: "Correo", key: "correo", width: 32 },
      { header: "Celular", key: "celular", width: 18 },
      { header: "Institución", key: "institucion", width: 30 },
      { header: "Área de conocimiento", key: "area", width: 28 },
      { header: "Estado evaluador", key: "estado", width: 18 },
      { header: "Cantidad proyectos asignados", key: "cantidad", width: 25 },
      { header: "Último acceso", key: "ultimo_acceso", width: 22 },
      { header: "Fecha de registro", key: "registro", width: 22 },
      { header: "Observaciones admin", key: "observaciones", width: 38 },
      { header: "Total asignaciones", key: "total", width: 20 },
      { header: "Evaluaciones completadas", key: "completadas", width: 24 },
      { header: "Evaluaciones pendientes", key: "pendientes", width: 23 },
    ]);
    addEvaluatorRows(worksheet, (evaluators || []).map(evaluator => {
      const evaluatorCounts = counts.get(evaluator.id) || { total: 0, completed: 0, pending: 0 };
      return {
        codigo: evaluator.codigo_evaluador || evaluator.id,
        nombre: evaluator.nombre_evaluador || evaluator.nombre || "",
        documento: evaluator.documento_evaluador || evaluator.documento || "",
        correo: evaluator.correo_evaluador || evaluator.correo || "",
        celular: evaluator.celular_evaluador || evaluator.celular || "",
        institucion: evaluator.institucion_evaluador || evaluator.entidad || "",
        area: evaluator.area_conocimiento || "",
        estado: evaluator.estado_evaluador || evaluator.estado || "Activo",
        cantidad: evaluator.cantidad_proyectos_asignados ?? evaluator.proyectos_asignados ?? evaluatorCounts.total,
        ultimo_acceso: evaluator.fecha_ultimo_acceso ? new Date(evaluator.fecha_ultimo_acceso) : null,
        registro: evaluator.created_at ? new Date(evaluator.created_at) : null,
        observaciones: evaluator.observaciones_admin || "",
        total: evaluatorCounts.total,
        completadas: evaluatorCounts.completed,
        pendientes: evaluatorCounts.pending,
      };
    }), ["ultimo_acceso", "registro"]);
    const excel = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(excel), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="evaluadores-proyectos.xlsx"',
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("[evaluators/export] error", error);
    return NextResponse.json({ error: "No fue posible generar la base de datos de evaluadores." }, { status: 500 });
  }
}
