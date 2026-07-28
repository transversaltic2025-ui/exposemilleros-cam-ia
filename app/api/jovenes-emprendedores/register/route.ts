import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { jovenEmprendedorSchema } from "@/lib/jovenes-emprendedores";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isYoungEntrepreneursRegistrationEnabled, YOUNG_ENTREPRENEURS_REGISTRATION_CLOSED_MESSAGE } from "@/lib/system-config";

function registrationCode() {
  const year = new Date().getFullYear();
  return `JOV-${year}-${crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")}`;
}

export async function POST(request: Request) {
  if (!(await isYoungEntrepreneursRegistrationEnabled())) {
    return NextResponse.json({ error: YOUNG_ENTREPRENEURS_REGISTRATION_CLOSED_MESSAGE }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Los datos enviados no tienen un formato válido." }, { status: 400 });
  }

  const parsed = jovenEmprendedorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues[0]?.message || "Revise los campos del formulario.",
      details: z.flattenError(parsed.error).fieldErrors,
    }, { status: 400 });
  }

  const client = createSupabaseServerClient();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const codigo_registro = registrationCode();
    const { error } = await client.from("jovenes_emprendedores").insert({
      ...parsed.data,
      documento: parsed.data.documento.replace(/[\s.,-]+/g, ""),
      correo: parsed.data.correo.toLowerCase(),
      codigo_registro,
      estado_registro: "Registrado",
    });
    if (!error) {
      return NextResponse.json({ success: true, codigo_registro }, { status: 201 });
    }
    if (error.code !== "23505") {
      console.error("[jovenes-emprendedores/register]", error);
      return NextResponse.json({ error: "No fue posible registrar la inscripción." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "No fue posible generar el código de registro. Intente nuevamente." }, { status: 500 });
}
