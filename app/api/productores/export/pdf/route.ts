import { NextResponse } from "next/server";
import { canExportProductores, getProductoresInitiatives } from "@/lib/productores-export";
import { createProductoresReportPdf } from "@/lib/productores-report-pdf";

export async function GET(request: Request) {
  if (!(await canExportProductores(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const pdf = createProductoresReportPdf(await getProductoresInitiatives());
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="iniciativas-campesinas.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "No fue posible generar el reporte." }, { status: 500 });
  }
}
