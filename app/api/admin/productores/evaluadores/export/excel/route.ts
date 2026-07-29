import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { addEvaluatorRows, createEvaluatorWorkbook } from "@/lib/evaluators-excel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const client = createSupabaseServerClient();
    const [{ data: evaluators, error: evaluatorsError }, { data: evaluations, error: evaluationsError }] = await Promise.all([
      client.from("evaluadoras_productores").select("id,nombre,documento,correo,activo,created_at").order("created_at", { ascending: false }),
      client.from("evaluaciones_productores").select("evaluadora_id"),
    ]);
    if (evaluatorsError) throw evaluatorsError;
    if (evaluationsError) throw evaluationsError;
    const counts = new Map<string, number>();
    for (const evaluation of evaluations || []) {
      if (evaluation.evaluadora_id) counts.set(evaluation.evaluadora_id, (counts.get(evaluation.evaluadora_id) || 0) + 1);
    }
    const { workbook, worksheet } = createEvaluatorWorkbook("Evaluadores productores", [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Documento", key: "documento", width: 18 },
      { header: "Correo", key: "correo", width: 32 },
      { header: "Estado", key: "estado", width: 16 },
      { header: "Fecha de registro", key: "registro", width: 22 },
      { header: "Total evaluaciones realizadas", key: "evaluaciones", width: 30 },
    ]);
    addEvaluatorRows(worksheet, (evaluators || []).map(evaluator => ({
      nombre: evaluator.nombre,
      documento: evaluator.documento,
      correo: evaluator.correo || "",
      estado: evaluator.activo ? "Activo" : "Inactivo",
      registro: evaluator.created_at ? new Date(evaluator.created_at) : null,
      evaluaciones: counts.get(evaluator.id) || 0,
    })), ["registro"]);
    const excel = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(excel), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="evaluadores-productores-campesinos.xlsx"',
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("[productores/evaluadores/export] error", error);
    return NextResponse.json({ error: "No fue posible generar la base de datos de evaluadores." }, { status: 500 });
  }
}
