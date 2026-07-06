import { createSupabaseServerClient } from "./server";

export const PROJECT_FILES_BUCKET = "project-files";
export const CERTIFICATES_BUCKET = "certificates";

type ProjectFileKind = "archivo" | "poster";

export async function uploadProjectFile(file: File, codigo: string, kind: ProjectFileKind = "archivo") {
  const supabase = createSupabaseServerClient();
  const extension = file.name.split(".").pop();
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const path = `proyectos/${codigo}/${kind}/${Date.now()}-${safeName || kind}${extension ? `.${extension}` : ""}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("[storage/project-files] error exacto al subir archivo", {
      bucket: PROJECT_FILES_BUCKET,
      path,
      error,
    });
    throw error;
  }

  console.log("[storage/project-files] archivo subido", {
    bucket: PROJECT_FILES_BUCKET,
    path,
    contentType: file.type || "application/octet-stream",
    size: file.size,
  });

  return path;
}

export async function createProjectFileSignedUrl(path: string, expiresIn = 60 * 60) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function uploadCertificatePdf(path: string, pdf: Buffer) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .upload(path, pdf, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return path;
}

export async function createCertificateSignedUrl(pathOrUrl: string, expiresIn = 60 * 60) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .createSignedUrl(pathOrUrl, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
