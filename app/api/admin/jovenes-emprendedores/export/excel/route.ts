import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createJovenesEmprendedoresExcel } from "@/lib/jovenes-emprendedores-excel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { data, error } = await createSupabaseServerClient()
      .from("jovenes_emprendedores")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const excel = await createJovenesEmprendedoresExcel(data ?? []);
    return new NextResponse(new Uint8Array(excel), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="jovenes-emprendedores.xlsx"',
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("[jovenes-emprendedores/export] error", error);
    return NextResponse.json({ error: "No fue posible generar la base de datos de jóvenes emprendedores." }, { status: 500 });
  }
}
