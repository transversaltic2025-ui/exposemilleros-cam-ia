import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateCertificatePdf } from "@/lib/certificates/pdf";
import { getActiveCertificateTemplate, textPositionsFromTemplate } from "@/lib/certificates/templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const type = new URL(request.url).searchParams.get("tipo") || "General";
    const template = await getActiveCertificateTemplate(type);
    if (!template) return NextResponse.json({ error: "No hay una plantilla activa para generar la vista previa." }, { status: 404 });

    const { data, error } = await createSupabaseServerClient().storage
      .from(template.bucket)
      .download(template.archivo_path);
    if (error || !data) throw error ?? new Error("No se pudo descargar la plantilla.");

    const previewRole = type === "Evaluador productores campesinos" || type === "Evaluadores"
      ? "Evaluador"
      : type === "Líder de proyecto" || type === "Instructores"
        ? "Líder de proyecto"
        : "Ponente";
    const pdf = await generateCertificatePdf({
      nombrePersona: "NOMBRE DE PRUEBA",
      documentoPersona: "1122334455",
      rolCertificado: previewRole,
      tipoCertificado: "Ponente",
    }, {
      templateBytes: new Uint8Array(await data.arrayBuffer()),
      positions: textPositionsFromTemplate(template),
      templateName: `${template.nombre} (${template.tipo_certificado})`,
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=certificado-vista-previa.pdf", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo generar la vista previa." }, { status: 500 });
  }
}
