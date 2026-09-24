import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signedDownload } from "@/lib/certificates/signed";
import { z } from "zod";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  const id = z.string().uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return NextResponse.json({ message: "Certificado inválido" }, { status: 400 });
  try {
    const { data, error } = await createSupabaseServerClient().from("certificados")
      .select("certificado_firmado_path,certificado_firmado_nombre").eq("id", id.data).single();
    if (error || !data?.certificado_firmado_path) return NextResponse.json({ message: "No hay un firmado disponible." }, { status: 404 });
    return NextResponse.redirect(await signedDownload(data.certificado_firmado_path, data.certificado_firmado_nombre), { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch { return NextResponse.json({ message: "No se pudo descargar el firmado." }, { status: 500 }); }
}
