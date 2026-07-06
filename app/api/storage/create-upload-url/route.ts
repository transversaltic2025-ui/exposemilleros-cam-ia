import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PROJECT_FILES_BUCKET } from "@/lib/supabase/storage";
import {
  validatePosterMetadata,
  validateProjectDocumentMetadata,
} from "@/lib/upload-limits";

const schema = z.object({
  codigoTemporal: z.string().min(8),
  tipo: z.enum(["archivo", "poster"]),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.coerce.number().nonnegative(),
});

function safeFileName(fileName: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${baseName || "archivo"}${extension ? `.${extension.toLowerCase()}` : ""}`;
}

export async function POST(request: Request) {
  try {
    const values = schema.parse(await request.json());
    const validation = values.tipo === "archivo"
      ? validateProjectDocumentMetadata({
        fileName: values.fileName,
        contentType: values.contentType,
        fileSize: values.fileSize,
      })
      : validatePosterMetadata({
        fileName: values.fileName,
        contentType: values.contentType,
        fileSize: values.fileSize,
      });

    console.log("[storage/create-upload-url] validacion de metadatos", {
      tipo: values.tipo,
      fileName: values.fileName,
      contentType: values.contentType,
      fileSize: values.fileSize,
      valid: validation.valid,
      reason: validation.reason,
    });

    if (!validation.valid) {
      console.warn("[storage/create-upload-url] rechazo por validacion", {
        tipo: values.tipo,
        fileName: values.fileName,
        contentType: values.contentType,
        fileSize: values.fileSize,
        reason: validation.reason,
      });
      return NextResponse.json(
        { error: validation.error ?? "Archivo invalido." },
        { status: 400 },
      );
    }

    const path = `proyectos/tmp/${values.codigoTemporal}/${values.tipo}/${Date.now()}-${safeFileName(values.fileName)}`;

    console.log("[storage/create-upload-url] creando signed upload URL", {
      bucket: PROJECT_FILES_BUCKET,
      tipo: values.tipo,
      fileName: values.fileName,
      contentType: values.contentType,
      fileSize: values.fileSize,
    });
    console.log("[storage/create-upload-url] path generado", path);

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .createSignedUploadUrl(path);

    if (error) {
      console.error("[storage/create-upload-url] error exacto Supabase Storage", error);
      throw error;
    }

    return NextResponse.json({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error("[storage/create-upload-url] error exacto", error);
    const message = error instanceof Error ? error.message : "No se pudo crear la URL de subida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
