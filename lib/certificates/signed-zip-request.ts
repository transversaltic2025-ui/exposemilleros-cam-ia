import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CERTIFICATES_BUCKET } from "@/lib/supabase/storage";
import { MAX_SIGNED_ZIP } from "./signed";
import { uploadSignedZip } from "./signed-zip";
import { signedCertificateError } from "./signed-schema";

export async function authorizeZipRequest(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ success: false, message: "Origen no permitido" }, { status: 403 });
  return null;
}
const batchSchema = z.object({
  zipPath: z.string().regex(/^firmados\/zips\/[a-zA-Z0-9_-]+\.zip$/),
  cursor: z.number().int().min(0).max(200).default(0),
  limit: z.number().int().min(1).max(30).default(30),
  replaceExisting: z.boolean().default(false),
}).strict();

export async function processZipRequest(request: Request, initial = false) {
  try {
    const denied = await authorizeZipRequest(request);
    if (denied) return denied;
    const input = batchSchema.parse(await request.json());
    if (initial && input.cursor !== 0) throw new Error("El procesamiento inicial debe comenzar en cero.");
    const storage = createSupabaseServerClient().storage.from(CERTIFICATES_BUCKET);
    const { data, error } = await storage.createSignedUrl(input.zipPath, 120);
    if (error) throw error;
    const response = await fetch(data.signedUrl, { cache: "no-store", signal: AbortSignal.timeout(60_000) });
    if (!response.ok || !response.body) throw new Error("No se pudo descargar el ZIP desde Storage. Vuelva a subirlo.");
    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.length;
        if (size > MAX_SIGNED_ZIP) throw new Error("El ZIP supera 50 MB.");
        chunks.push(Buffer.from(chunk.value));
      }
    } finally { await reader.cancel(); }
    return NextResponse.json(await uploadSignedZip(Buffer.concat(chunks), input.replaceExisting, input.cursor, input.limit));
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof z.ZodError ? "Ruta, cursor o límite de ZIP inválidos." : signedCertificateError(error, "No se pudo procesar el ZIP.") }, { status: 400 });
  }
}
