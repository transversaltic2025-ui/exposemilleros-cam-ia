import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateCertificates } from "@/lib/certificates/generate";
import { certificateErrorMessage } from "@/lib/certificates/errors";

export const runtime = "nodejs";
export const maxDuration = 60;
const typeMap = {
  investigadores: "Investigador", ponentes: "Ponente", lideres: "Líder de proyecto", evaluadores: "Evaluador",
  "evaluadores-productores": "Evaluador productores campesinos", todos: "todos",
} as const;
const schema = z.object({
  tipo: z.enum(["ponentes", "lideres", "evaluadores", "evaluadores-productores", "investigadores", "todos"]).optional(),
  tipo_certificado: z.enum(["Ponente", "Líder de proyecto", "Evaluador", "Evaluador productores campesinos", "Investigador"]).optional(),
  regenerate: z.boolean().optional(),
  overwrite: z.boolean().optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(25).default(25),
}).refine(value => value.tipo || value.tipo_certificado, "Indique el tipo de certificado.");

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, message: "No autorizado", error: "No autorizado" }, { status: 401 });
    }
    const values = schema.parse(await request.json());
    const type = values.tipo ? typeMap[values.tipo] : values.tipo_certificado!;
    const result = await generateCertificates(type, values.regenerate ?? values.overwrite ?? false, values.offset, values.limit);
    const tipo = values.tipo ?? Object.entries(typeMap).find(([, name]) => name === type)?.[0];
    return NextResponse.json({ ...result, tipo });
  } catch (error) {
    const message = certificateErrorMessage(error);
    console.error("[certificates/generate] error de solicitud", error);
    return NextResponse.json({ success: false, message, error: message }, {
      status: error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 500,
    });
  }
}
