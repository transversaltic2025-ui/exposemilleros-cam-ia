import { NextResponse } from "next/server";
import { z } from "zod";

import { generateCertificates } from "@/lib/certificates/generate";

export const runtime = "nodejs";

const schema = z.object({
  tipo_certificado: z.enum(["Participante", "Ponente", "Instructor", "Evaluador"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const values = schema.parse(body);
    const result = await generateCertificates(values.tipo_certificado);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron generar certificados.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
