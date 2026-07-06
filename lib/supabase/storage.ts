import { createSupabaseServerClient } from "./server";

export const PROJECT_FILES_BUCKET = "project-files";
export const CERTIFICATES_BUCKET = "certificates";

export async function uploadProjectFile(file: File, codigo: string) {
  const supabase = createSupabaseServerClient();
  const extension = file.name.split(".").pop();
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const path = `${codigo}/${Date.now()}-${safeName || "archivo"}${extension ? `.${extension}` : ""}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw error;
  }

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
