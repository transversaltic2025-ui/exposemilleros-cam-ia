import { certificateErrorMessage } from "@/lib/certificates/errors";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateCertificatePdf } from "@/lib/certificates/pdf";
import { getActiveCertificateTemplate, textPositionsFromTemplate } from "@/lib/certificates/templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: "No autorizado", error: "No autorizado" }, { status: 401 });
    const type = new URL(request.url).searchParams.get("tipo") || "General";
    const template = await getActiveCertificateTemplate(type);
    if (!template) return NextResponse.json({ success: false, message: "No hay plantilla PDF activa.", error: "No hay plantilla PDF activa." }, { status: 404 });

    const { data, error } = await createSupabaseServerClient().storage
      .from(template.bucket)
      .download(template.archivo_path);
    if (error || !data) throw error ?? new Error("No se pudo descargar la plantilla.");

    const previewRole = type === "Investigador" ? "Investigador" : type === "Evaluador productores campesinos" || type === "Evaluadores"
      ? "Evaluador"
      : type === "Líder de proyecto" || type === "Instructores"
        ? "Líder de proyecto"
        : "Ponente";
    const pdf = await generateCertificatePdf({
      nombre: "NOMBRE DE PRUEBA",
      documento: "1122334455",
      rol: previewRole,
      templatePdfBytes: new Uint8Array(await data.arrayBuffer()),
      posiciones: textPositionsFromTemplate(template),
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=certificado-vista-previa.pdf", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = certificateErrorMessage(error);
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
