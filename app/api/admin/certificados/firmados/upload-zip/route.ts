import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { MAX_SIGNED_ZIP } from "@/lib/certificates/signed";
import { uploadSignedZip } from "@/lib/certificates/signed-zip";

export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ message: "Origen no permitido" }, { status: 403 });
  if (Number(request.headers.get("content-length")) > MAX_SIGNED_ZIP + 65536) return NextResponse.json({ message: "El ZIP supera 50 MB." }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get("archivo");
    if (!(file instanceof File) || !/\.zip$/i.test(file.name) || file.size > MAX_SIGNED_ZIP) return NextResponse.json({ message: "Seleccione un ZIP de máximo 50 MB." }, { status: 400 });
    return NextResponse.json(await uploadSignedZip(Buffer.from(await file.arrayBuffer()), form.get("reemplazar") === "true"));
  } catch (error) {
    console.error("[firmados/zip]", error);
    return NextResponse.json({ message: "No fue posible procesar el ZIP. Revise que sea válido, con máximo 200 archivos y 50 MB." }, { status: 400 });
  }
}
