import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer" };

function normalizeDocument(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, message: "Falta configurar NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel." }, { status: 500, headers });
    }
    let body: unknown;
    try { body = await request.json(); }
    catch {
      return NextResponse.json({ success: false, message: "La solicitud no contiene JSON v\u00e1lido." }, { status: 400, headers });
    }
    const documentoBuscado = normalizeDocument(body && typeof body === "object" && "documento" in body ? body.documento : undefined);
    if (!documentoBuscado) {
      return NextResponse.json({ success: false, message: "Digite un n\u00famero de documento v\u00e1lido." }, { status: 400, headers });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: certificados, error } = await supabase.from("certificados").select(
      "id,nombre_persona,documento_persona,tipo_certificado,estado_firma,certificado_firmado_path,certificado_firmado_nombre,certificado_firmado_at"
    );
    if (error) {
      console.error("[certificados-consultar] error consultando certificados", error);
      return NextResponse.json({ success: false, message: "Error consultando certificados en Supabase.", detail: error.message }, { status: 500, headers });
    }
    const matches = (certificados ?? []).filter(cert => normalizeDocument(cert.documento_persona) === documentoBuscado);
    console.log("[certificados-consultar] documento:", documentoBuscado);
    console.log("[certificados-consultar] total consultados:", certificados?.length ?? 0);
    console.log("[certificados-consultar] coincidencias:", matches.length);
    if (!matches.length) {
      return NextResponse.json({ success: true, results: [], message: "No se encontraron certificados asociados a este documento." }, { headers });
    }
    const firmados = matches.filter(cert => String(cert.estado_firma ?? "").trim().toLowerCase() === "firmado" && String(cert.certificado_firmado_path ?? "").trim().length > 0);
    console.log("[certificados-consultar] firmados:", firmados.length);
    if (!firmados.length) {
      const tieneFirmadoSinPath = matches.some(cert => String(cert.estado_firma ?? "").trim().toLowerCase() === "firmado" && !String(cert.certificado_firmado_path ?? "").trim());
      return NextResponse.json({ success: true, results: [], message: tieneFirmadoSinPath
        ? "El certificado figura como firmado, pero no tiene archivo asociado."
        : "Sus certificados existen, pero a\u00fan no se encuentran disponibles en versi\u00f3n firmada." }, { headers });
    }
    const results = [];
    for (const cert of firmados) {
      const path = String(cert.certificado_firmado_path ?? "").trim();
      const { data: signedData, error: signedError } = await supabase.storage.from("certificates").createSignedUrl(path, 600);
      if (signedError || !signedData?.signedUrl) {
        console.error("[certificados-consultar] signedUrl error", { certificadoId: cert.id, path, signedError });
        return NextResponse.json({ success: false, message: "No se pudo generar el enlace de descarga del certificado firmado.", detail: signedError?.message ?? "No se recibi\u00f3 URL firmada desde Supabase Storage.", path }, { status: 500, headers });
      }
      results.push({ id: cert.id, nombre_persona: cert.nombre_persona, documento_mostrado: cert.documento_persona,
        tipo_certificado: cert.tipo_certificado, certificado_firmado_at: cert.certificado_firmado_at, downloadUrl: signedData.signedUrl });
    }
    return NextResponse.json({ success: true, message: "Certificados encontrados.", results }, { headers });
  } catch (error) {
    console.error("[certificados-consultar] error inesperado", error);
    return NextResponse.json({ success: false, message: "Error consultando certificados.", detail: error instanceof Error ? error.message : String(error) }, { status: 500, headers });
  }
}
