import { NextResponse } from "next/server";
import { canExportProductores, createProductoresExcel, getProductoresInitiatives } from "@/lib/productores-export";

export async function GET(request: Request) {
  if (!(await canExportProductores(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const excel = await createProductoresExcel(await getProductoresInitiatives());
    return new NextResponse(new Uint8Array(excel), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="iniciativas-campesinas.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "No fue posible generar la exportación." }, { status: 500 });
  }
}
