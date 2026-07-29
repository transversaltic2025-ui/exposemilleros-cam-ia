import { NextResponse } from "next/server";
import { z } from "zod";
import { createProductoresAccessToken, findProductoresAccessByDocument, verifyProductoresPassword } from "@/lib/productores-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ documento: z.string().trim().min(5), clave: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Documento o clave incorrectos." }, { status: 401 });
    const access = await findProductoresAccessByDocument(parsed.data.documento);
    if (!access) return NextResponse.json({ error: "Documento o clave incorrectos." }, { status: 401 });
    if (!access.activo) return NextResponse.json({ error: "Este acceso se encuentra inactivo. Comuníquese con el administrador." }, { status: 403 });
    if (!(await verifyProductoresPassword(parsed.data.clave, access.clave_hash))) {
      return NextResponse.json({ error: "Documento o clave incorrectos." }, { status: 401 });
    }
    const token = createProductoresAccessToken();
    const { error } = await createSupabaseServerClient().from("accesos_productores").update({
      token_acceso: token,
      ultimo_acceso: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", access.id);
    if (error) throw error;
    return NextResponse.json({ token });
  } catch (error) {
    console.error("[productores/acceso/login] error", error);
    return NextResponse.json({ error: "No fue posible iniciar el acceso. Intente nuevamente." }, { status: 500 });
  }
}
