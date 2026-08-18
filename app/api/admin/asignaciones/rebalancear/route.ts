import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { rebalanceAutomaticProjectAssignments } from "@/lib/supabase/queries";
import { isAutomaticProjectAssignmentEnabled } from "@/lib/system-config";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!(await isAutomaticProjectAssignmentEnabled())) {
    return NextResponse.json(
      { error: "La asignación automática está desactivada." },
      { status: 409 },
    );
  }
  try {
    const summary = await rebalanceAutomaticProjectAssignments();
    return NextResponse.json({
      success: true,
      message: "Asignaciones automáticas rebalanceadas correctamente.",
      ...summary,
    });
  } catch (error) {
    console.error("[admin/asignaciones/rebalancear]", error);
    return NextResponse.json(
      { error: "No fue posible rebalancear las asignaciones automáticas." },
      { status: 500 },
    );
  }
}
