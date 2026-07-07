import { NextResponse } from "next/server";
import { z } from "zod";

import { recoverEvaluatorAccessByDocument } from "@/lib/supabase/queries";

const schema = z.object({
  documento_evaluador: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const values = schema.parse(await request.json());
    const result = await recoverEvaluatorAccessByDocument(values.documento_evaluador);

    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (error) {
    console.error("[evaluators/recover-access] error exacto", error);
    const message = error instanceof Error ? error.message : "No se pudo recuperar el acceso.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
