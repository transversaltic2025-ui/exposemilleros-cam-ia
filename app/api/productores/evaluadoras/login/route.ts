import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizarDocumento } from "@/lib/productores";
import { createEvaluadoraToken } from "@/lib/productores-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ documento: z.string().trim().min(5) });

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Los datos enviados no tienen un formato válido." }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ingrese un número de documento válido." }, { status: 400 });
    const documento = normalizarDocumento(parsed.data.documento);
    if (documento.length < 5) return NextResponse.json({ error: "Ingrese un número de documento válido." }, { status: 400 });
    const { data, error } = await createSupabaseServerClient()
      .from("evaluadoras_productores")
      .select("id,nombre,documento,activo")
      .eq("documento", documento)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "No encontramos una evaluadora activa con ese documento." }, { status: 404 });
    if (!data.activo) return NextResponse.json({ error: "La evaluadora se encuentra inactiva. Comuníquese con el equipo organizador." }, { status: 403 });
    return NextResponse.json({ success: true, token: createEvaluadoraToken(data.id), evaluadora: { nombre: data.nombre, documento: data.documento } });
  } catch (error) {
    console.error("[productores/evaluadoras/login] error:", error);
    return NextResponse.json({ error: "No fue posible validar el acceso." }, { status: 500 });
  }
}
