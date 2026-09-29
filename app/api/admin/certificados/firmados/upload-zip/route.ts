import { NextResponse } from "next/server";
import { authorizeZipRequest } from "@/lib/certificates/signed-zip-request";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const denied = await authorizeZipRequest(request);
    if (denied) return denied;
    return NextResponse.json({ success: false, message: "Use la carga directa a Storage desde /admin/certificados/firmados." }, { status: 410 });
  } catch {
    return NextResponse.json({ success: false, message: "No se pudo validar la petición." }, { status: 500 });
  }
}
