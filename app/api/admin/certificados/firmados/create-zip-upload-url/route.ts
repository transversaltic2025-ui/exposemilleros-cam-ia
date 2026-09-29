import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeZipRequest } from "@/lib/certificates/signed-zip-request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CERTIFICATES_BUCKET } from "@/lib/supabase/storage";
import { MAX_SIGNED_ZIP } from "@/lib/certificates/signed";
import { signedCertificateError } from "@/lib/certificates/signed-schema";

import { sanitizeStorageKey } from "@/lib/certificates/storage-key";

export const runtime = "nodejs";
const schema = z.object({
  fileName: z.string().min(1).max(255).regex(/^[^\/\\\x00]+\.zip$/i),
  fileType: z.enum(["application/zip", "application/x-zip-compressed", "application/x-zip", "application/octet-stream", ""]),
  fileSize: z.number().int().positive().max(MAX_SIGNED_ZIP),
}).strict();
export async function POST(request: Request) {
  try {
    const denied = await authorizeZipRequest(request);
    if (denied) return denied;
    const input = schema.parse(await request.json());
    const cleanName = sanitizeStorageKey(input.fileName.replace(/\.zip$/i, "")).slice(0, 160) || "certificados-firmados";
    const zipPath = `firmados/zips/${Date.now()}-${crypto.randomUUID()}-${cleanName}.zip`;
    const { data, error } = await createSupabaseServerClient().storage.from(CERTIFICATES_BUCKET).createSignedUploadUrl(zipPath);
    if (error) throw error;
    return NextResponse.json({ success: true, path: zipPath, token: data.token, signedUrl: data.signedUrl });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof z.ZodError ? "Seleccione un archivo ZIP válido de máximo 50 MB." : signedCertificateError(error, "No se pudo preparar la carga a Storage.") }, { status: 400 });
  }
}
