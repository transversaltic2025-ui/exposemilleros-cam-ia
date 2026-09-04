import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  CERTIFICATE_TEMPLATE_TYPES,
  DEFAULT_TEXT_POSITIONS,
  MISSING_TEMPLATES_TABLE_MESSAGE,
  isMissingTemplatesTableError,
} from "@/lib/certificates/templates";
import { CERTIFICATES_BUCKET } from "@/lib/supabase/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const positionSchema = z.object({
  templateId: z.string().uuid(),
  nombre: z.object({
    x: z.number().min(0).max(2000),
    y: z.number().min(0).max(2000),
    size: z.number().min(6).max(100),
    maxWidth: z.number().min(20).max(2000),
  }),
  documento: z.object({
    x: z.number().min(0).max(2000), y: z.number().min(0).max(2000),
    size: z.number().min(6).max(100), maxWidth: z.number().min(20).max(2000),
  }),
  rol: z.object({
    x: z.number().min(0).max(2000), y: z.number().min(0).max(2000),
    size: z.number().min(6).max(100), maxWidth: z.number().min(20).max(2000),
  }),
});

function errorResponse(error: { code?: string; message?: string } | null, fallback: string) {
  if (isMissingTemplatesTableError(error)) {
    return NextResponse.json({ error: MISSING_TEMPLATES_TABLE_MESSAGE }, { status: 503 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const formData = await request.formData();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo_certificado") ?? "");
  const activo = formData.get("activo") === "true";
  const file = formData.get("archivo");

  if (!nombre || !CERTIFICATE_TEMPLATE_TYPES.includes(tipo as (typeof CERTIFICATE_TEMPLATE_TYPES)[number])) {
    return NextResponse.json({ error: "Complete el nombre y el tipo de certificado." }, { status: 400 });
  }
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se permite subir archivos PDF." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "El archivo supera el tamaño máximo permitido." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { error: tableError } = await supabase.from("certificados_plantillas").select("id").limit(1);
  if (tableError) return errorResponse(tableError, "No se pudo consultar la configuración de plantillas.");
  const timestamp = Date.now();
  const path = `templates/certificados/${timestamp}-plantilla.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: "application/pdf", upsert: false });
  if (uploadError) return NextResponse.json({ error: "No se pudo subir la plantilla PDF." }, { status: 500 });

  if (activo) {
    const { error } = await supabase
      .from("certificados_plantillas")
      .update({ activo: false })
      .eq("tipo_certificado", tipo)
      .eq("activo", true);
    if (error) return errorResponse(error, "No se pudo actualizar la plantilla activa.");
  }

  const { data, error } = await supabase.from("certificados_plantillas").insert({
    nombre,
    tipo_certificado: tipo,
    bucket: CERTIFICATES_BUCKET,
    archivo_path: path,
    archivo_nombre: file.name,
    archivo_tipo: file.type,
    archivo_size: file.size,
    activo,
    posiciones: DEFAULT_TEXT_POSITIONS,
  }).select("*").single();

  if (error) return errorResponse(error, "No se pudo registrar la plantilla.");
  return NextResponse.json({ template: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = positionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "La posición indicada no es válida." }, { status: 400 });

  const { error } = await createSupabaseServerClient()
    .from("certificados_plantillas")
    .update({ posiciones: {
      nombre: { ...parsed.data.nombre, align: "center" },
      documento: { ...parsed.data.documento, align: "left" },
      rol: { ...parsed.data.rol, align: "center" },
    } })
    .eq("id", parsed.data.templateId);
  if (error) return errorResponse(error, "No se pudo guardar la posición.");
  return NextResponse.json({ success: true });
}
