import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { hashProductoresPassword } from "@/lib/productores-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  nombre: z.string().trim().min(3).optional(),
  correo: z.union([z.string().trim().email(), z.literal("")]).optional(),
  activo: z.boolean().optional(),
  nueva_clave: z.string().min(8, "La nueva clave debe tener al menos 8 caracteres.").optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
    const values = parsed.data;
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (values.nombre !== undefined) changes.nombre = values.nombre;
    if (values.correo !== undefined) changes.correo = values.correo || null;
    if (values.activo !== undefined) {
      changes.activo = values.activo;
      if (!values.activo) changes.token_acceso = null;
    }
    if (values.nueva_clave !== undefined) {
      changes.clave_hash = await hashProductoresPassword(values.nueva_clave);
      changes.token_acceso = null;
    }
    const { id } = await params;
    const { data, error } = await createSupabaseServerClient().from("accesos_productores")
      .update(changes).eq("id", id)
      .select("id,nombre,documento,correo,activo,ultimo_acceso,created_at,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Acceso no encontrado." }, { status: 404 });
    return NextResponse.json({ acceso: data, mensaje: "Acceso actualizado correctamente." });
  } catch (error) {
    console.error("[admin/productores/accesos/id] error", error);
    return NextResponse.json({ error: "No fue posible actualizar el acceso." }, { status: 500 });
  }
}
