import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MAX_SIGNED_PDF, saveSignedCertificate } from "@/lib/certificates/signed";
import type { SignedCertificate } from "@/types/signed-certificate";
import { z } from "zod";
import { SIGNED_CERTIFICATE_COLUMNS, signedCertificateError } from "@/lib/certificates/signed-schema";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ message: "Origen no permitido" }, { status: 403 });
  if (Number(request.headers.get("content-length")) > MAX_SIGNED_PDF + 65536) return NextResponse.json({ message: "El PDF supera 15 MB." }, { status: 413 });
  try {
    const form = await request.formData();
    const id = z.string().uuid().parse(form.get("certificadoId"));
    const file = form.get("archivo");
    if (!(file instanceof File) || file.size > MAX_SIGNED_PDF) return NextResponse.json({ message: "Seleccione un PDF de máximo 15 MB." }, { status: 400 });
    const db = createSupabaseServerClient();
    const { data, error } = await db.from("certificados").select(["*", ...SIGNED_CERTIFICATE_COLUMNS].join(",")).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ message: "Certificado no encontrado." }, { status: 404 });
    const certificate = data as unknown as SignedCertificate;
    if (certificate.certificado_firmado_path && form.get("reemplazar") !== "true") return NextResponse.json({ message: "Confirme el reemplazo del certificado firmado." }, { status: 409 });
    const estado = await saveSignedCertificate(certificate, file.name, Buffer.from(await file.arrayBuffer()), form.get("reemplazar") === "true");
    const errorId = form.get("errorId");
    let warning = "";
    if (typeof errorId === "string" && z.string().uuid().safeParse(errorId).success) {
      const { error: resolveError } = await db.from("certificados_firma_errores").update({ resuelto: true }).eq("id", errorId);
      if (resolveError) warning = " El firmado se guardó, pero no se pudo cerrar el error de asociación.";
    }
    return NextResponse.json({ message: `${estado}: certificado firmado guardado.${warning}` });
  } catch (error) {
    console.error("[firmados/upload]", error);
    return NextResponse.json({ message: signedCertificateError(error, "No se pudo subir el certificado.") }, { status: 400 });
  }
}
