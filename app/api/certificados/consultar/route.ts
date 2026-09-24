import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeDocument } from "@/lib/certificates/signed-matching";
import { listSignedCertificates, signedDownload } from "@/lib/certificates/signed";
import { allowCertificateLookup } from "@/lib/certificates/lookup-limit";

const schema = z.object({ documento: z.string().max(80).transform(normalizeDocument).pipe(z.string().min(5).max(25)) }).strict();
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer" };
  if (!allowCertificateLookup(request)) return NextResponse.json({ message: "Ha realizado muchas consultas. Espere un minuto e intente nuevamente." }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Ingrese un número de documento válido." }, { status: 400, headers });
    const rows = await listSignedCertificates(parsed.data.documento);
    const signed = rows.filter(row => row.estado_firma === "Firmado" && row.certificado_firmado_path);
    const certificados = await Promise.all(signed.map(async row => ({
      nombre_persona: row.nombre_persona ?? "", tipo_certificado: row.tipo_certificado ?? "Certificado",
      proyecto: row.proyecto_nombre ?? row.proyecto_codigo ?? row.iniciativa_nombre ?? row.iniciativa_codigo ?? null, fecha_generacion: row.created_at ?? null,
      descarga: await signedDownload(row.certificado_firmado_path!, row.certificado_firmado_nombre),
    })));
    return NextResponse.json({ certificados, message: certificados.length ? "Los enlaces de descarga vencen en 10 minutos. Puede consultar nuevamente."
      : rows.length ? "Sus certificados están generados, pero aún no han sido cargados en versión firmada."
        : "No se encontraron certificados firmados asociados a este documento." }, { headers });
  } catch {
    return NextResponse.json({ message: "No fue posible consultar sus certificados. Intente nuevamente." }, { status: 500, headers });
  }
}
