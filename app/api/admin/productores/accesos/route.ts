import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { hashProductoresPassword } from "@/lib/productores-access";
import { normalizarDocumento } from "@/lib/productores";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createSchema = z.object({
  nombre: z.string().trim().min(3, "Ingrese el nombre completo."),
  documento: z.string().trim().min(5, "Ingrese el número de documento."),
  correo: z.union([z.string().trim().email("Ingrese un correo electrónico válido."), z.literal("")]).optional(),
  clave: z.string().min(8, "La clave temporal debe tener al menos 8 caracteres."),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data, error } = await createSupabaseServerClient()
    .from("accesos_productores")
    .select("id,nombre,documento,correo,activo,ultimo_acceso,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "No fue posible consultar los accesos." }, { status: 500 });
  return NextResponse.json({ accesos: data || [] });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const values = parsed.data;
    const documento = normalizarDocumento(values.documento);
    const client = createSupabaseServerClient();
    const { data: existing, error: lookupError } = await client.from("accesos_productores").select("id").eq("documento", documento).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return NextResponse.json({ error: "Ya existe un acceso registrado con este documento." }, { status: 409 });
    const { data, error } = await client.from("accesos_productores").insert({
      nombre: values.nombre,
      documento,
      correo: values.correo || null,
      clave_hash: await hashProductoresPassword(values.clave),
      activo: true,
    }).select("id,nombre,documento,correo,activo,ultimo_acceso,created_at").single();
    if (error?.code === "23505") return NextResponse.json({ error: "Ya existe un acceso registrado con este documento." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ acceso: data, mensaje: "Acceso creado correctamente." }, { status: 201 });
  } catch (error) {
    console.error("[admin/productores/accesos] error", error);
    return NextResponse.json({ error: "No fue posible crear el acceso." }, { status: 500 });
  }
}
