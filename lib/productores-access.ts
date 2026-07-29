import "server-only";

import crypto from "node:crypto";
import { promisify } from "node:util";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizarDocumento } from "@/lib/productores";

const scrypt = promisify(crypto.scrypt);

export async function hashProductoresPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("base64url")}:${derived.toString("base64url")}`;
}

export async function verifyProductoresPassword(password: string, storedHash: string) {
  try {
    const [algorithm, saltValue, hashValue] = storedHash.split(":");
    if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;
    const expected = Buffer.from(hashValue, "base64url");
    const derived = (await scrypt(password, Buffer.from(saltValue, "base64url"), expected.length)) as Buffer;
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function createProductoresAccessToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function findProductoresAccessByToken(token?: string | null) {
  if (!token || token.length < 32 || token.length > 200) return null;
  const { data, error } = await createSupabaseServerClient()
    .from("accesos_productores")
    .select("id,nombre,documento,correo,activo,ultimo_acceso")
    .eq("token_acceso", token)
    .maybeSingle();
  if (error || !data?.activo) return null;
  return data;
}

export async function findProductoresAccessByDocument(documento: string) {
  const { data, error } = await createSupabaseServerClient()
    .from("accesos_productores")
    .select("*")
    .eq("documento", normalizarDocumento(documento))
    .maybeSingle();
  if (error) throw error;
  return data;
}
