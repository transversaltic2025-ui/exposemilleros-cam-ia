import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ nombre: z.string().trim().min(3), correo: z.union([z.string().trim().email(), z.literal(""), z.null()]).optional(), activo: z.boolean() });
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
    const { data, error } = await createSupabaseServerClient().from("evaluadoras_productores").update({ nombre: parsed.data.nombre, correo: parsed.data.correo || null, activo: parsed.data.activo }).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ evaluadora: data });
  } catch (error) {
    console.error("[admin/productores/evaluadoras/id] error:", error);
    return NextResponse.json({ error: "No fue posible actualizar la evaluadora." }, { status: 500 });
  }
}
