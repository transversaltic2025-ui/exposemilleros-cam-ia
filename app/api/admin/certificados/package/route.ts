import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createCertificatesZip, type PackageCertificate } from "@/lib/certificates/package";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const querySchema = z.object({
  tipo: z.enum(["ponente", "lider", "instructor", "evaluador", "evaluador-productores", "productor", "joven", "todos"]),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(30).default(30),
});

const typeMap: Record<string, string> = {
  ponente: "Ponente",
  instructor: "Instructor",
  lider: "Líder de proyecto",
  evaluador: "Evaluador",
  "evaluador-productores": "Evaluador productores campesinos",
  productor: "Productor campesino",
  joven: "Joven emprendedor",
};
const pluralMap: Record<string, string> = {
  ponente: "ponentes", lider: "lider-proyecto", instructor: "instructores", evaluador: "evaluadores",
  "evaluador-productores": "evaluadores-productores",
  productor: "productores-campesinos", joven: "jovenes-emprendedores", todos: "todos",
};

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Los parámetros del paquete no son válidos." }, { status: 400 });

  const { tipo, offset, limit } = parsed.data;
  let query = createSupabaseServerClient().from("certificados").select("*").not("url_certificado", "is", null);
  if (tipo !== "todos") {
    query = tipo === "lider" || tipo === "instructor"
      ? query.in("tipo_certificado", ["Líder de proyecto", "Instructor", "Instructor líder"])
      : query.eq("tipo_certificado", typeMap[tipo]);
  }
  const { data, error } = await query.order("created_at", { ascending: true }).range(offset, offset + limit - 1);
  if (error) {
    console.error("[certificados/package] consulta", error);
    return NextResponse.json({ success: false, message: "No fue posible consultar los certificados." }, { status: 500 });
  }

  const certificates = ((data ?? []) as PackageCertificate[]).filter(item => item.url_certificado || item.archivo_certificado_url);
  if (!certificates.length) return NextResponse.json({ success: false, message: "No hay certificados generados para descargar." }, { status: 404 });

  const zip = await createCertificatesZip(certificates);
  if (!zip) return NextResponse.json({ success: false, message: "No hay certificados generados para descargar." }, { status: 404 });
  const packageNumber = Math.floor(offset / limit) + 1;
  return new NextResponse(new Uint8Array(zip), { headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="certificados-${pluralMap[tipo]}-paquete-${packageNumber}.zip"`,
    "Cache-Control": "no-store",
  } });
}
