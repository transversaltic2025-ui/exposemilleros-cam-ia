import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizarDocumento } from "@/lib/productores";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  nombre: z.string().trim().min(3, "Ingrese el nombre completo de la evaluadora."),
  documento: z.string().trim().min(5, "Ingrese el número de documento."),
  correo: z.union([z.string().trim().email("Ingrese un correo electrónico válido."), z.literal("")]).optional(),
  activo: z.boolean().default(true),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { data, error } = await createSupabaseServerClient().from("evaluadoras_productores").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ evaluadoras: data || [] });
  } catch (error) {
    console.error("[admin/productores/evaluadoras] error:", error);
    return NextResponse.json({ error: "No fue posible consultar las evaluadoras." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Los datos enviados no tienen un formato válido." }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revise los campos del formulario." }, { status: 400 });
    const values = parsed.data;
    const documento = normalizarDocumento(values.documento);
    const client = createSupabaseServerClient();
    const { data: existing, error: lookupError } = await client.from("evaluadoras_productores").select("id").eq("documento", documento).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return NextResponse.json({ error: "Ya existe una evaluadora registrada con este documento." }, { status: 400 });
    const { data, error } = await client.from("evaluadoras_productores").insert({ nombre: values.nombre, documento, correo: values.correo || null, activo: values.activo }).select().single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Ya existe una evaluadora registrada con este documento." }, { status: 400 });
      throw error;
    }
    return NextResponse.json({ evaluadora: data, mensaje: "Evaluadora registrada correctamente." }, { status: 201 });
  } catch (error) {
    console.error("[admin/productores/evaluadoras] error:", error);
    return NextResponse.json({ error: "No fue posible registrar la evaluadora." }, { status: 500 });
  }
}
