import { NextResponse } from "next/server";
import { z } from "zod";
import { iniciativaProductorSchema } from "@/lib/productores";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Los datos enviados no tienen un formato válido." }, { status: 400 });
    }

    const parsed = iniciativaProductorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: z.prettifyError(parsed.error).split("\n")[0] || "Revise los campos del formulario." },
        { status: 400 },
      );
    }

    const values = parsed.data;
    const year = new Date().getFullYear();
    const shortId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase().slice(-8);
    const codigo_iniciativa = `PROD-${year}-${shortId}`;
    const payload = {
      codigo_iniciativa,
      nombre_productor: values.nombre_productor,
      documento: values.documento,
      celular: values.celular,
      municipio: values.municipio,
      vereda: values.vereda || null,
      nombre_iniciativa: values.nombre_iniciativa,
      anio_inicio: values.anio_inicio,
      linea_productiva: values.linea_productiva,
      linea_productiva_otro: values.linea_productiva_otro || null,
      descripcion_iniciativa: values.descripcion_iniciativa,
      producto_servicio: values.producto_servicio,
      nivel_madurez: values.nivel_madurez,
      productos_obtenidos: values.productos_obtenidos,
      productos_obtenidos_otro: values.productos_obtenidos_otro || null,
      donde_vende: values.donde_vende,
      donde_vende_otro: values.donde_vende_otro || null,
      principal_dificultad: values.principal_dificultad,
      principal_dificultad_otro: values.principal_dificultad_otro || null,
      estado_registro: "Registrada",
      estado_analisis_ia: "Pendiente",
    };

    const { error } = await createSupabaseServerClient().from("productores_iniciativas").insert(payload);
    if (error) throw error;

    return NextResponse.json({ success: true, codigo_iniciativa, mensaje: "Iniciativa registrada correctamente." }, { status: 201 });
  } catch (error) {
    console.error("[productores/register] error:", error);
    return NextResponse.json({ error: "No fue posible registrar la iniciativa." }, { status: 500 });
  }
}
