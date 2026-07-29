import "server-only";

import JSZip from "jszip";
import { PROJECT_FILES_BUCKET } from "@/lib/supabase/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PosterProject = {
  id: string;
  codigo_proyecto: string;
  nombre_proyecto: string;
  poster_proyecto_path: string;
  poster_proyecto_nombre?: string | null;
  poster_proyecto_tipo?: string | null;
};

export function sanitizeFileName(text: string) {
  return text
    .replace(/[\/\\:"*?<>|]/g, "-")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.\s-]+$/g, "")
    .trim()
    .slice(0, 150) || "poster";
}

const MIME_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/tiff": "tif",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

function extensionFrom(value?: string | null) {
  const clean = String(value || "").split("?")[0];
  const match = clean.match(/\.([a-z0-9]{1,8})$/i);
  return match?.[1]?.toLowerCase();
}

export function getPosterExtension(project: PosterProject) {
  return extensionFrom(project.poster_proyecto_nombre)
    || MIME_EXTENSIONS[String(project.poster_proyecto_tipo || "").toLowerCase()]
    || extensionFrom(project.poster_proyecto_path)
    || "pdf";
}

export function getPosterFileName(project: PosterProject) {
  const base = sanitizeFileName(`${project.codigo_proyecto} - ${project.nombre_proyecto}`);
  return `${base}.${getPosterExtension(project)}`;
}

export async function downloadPoster(path: string) {
  const { data, error } = await createSupabaseServerClient().storage
    .from(PROJECT_FILES_BUCKET)
    .download(path);
  if (error || !data) throw new Error(error?.message || "Archivo no encontrado en Storage.");
  return Buffer.from(await data.arrayBuffer());
}

export async function createPostersZip(projects: PosterProject[]) {
  const zip = new JSZip();
  const errors: string[] = [];
  let downloaded = 0;

  for (const project of projects) {
    try {
      zip.file(getPosterFileName(project), await downloadPoster(project.poster_proyecto_path));
      downloaded += 1;
    } catch (error) {
      errors.push(`${project.codigo_proyecto} - ${project.nombre_proyecto}: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }
  if (errors.length) zip.file("errores-descarga.txt", errors.join("\r\n"));
  if (!downloaded) return null;
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
