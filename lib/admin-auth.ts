import crypto from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const FALLBACK_ADMIN_ACCESS_KEY = "expoadmin2026";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

function getAdminAccessKey() {
  return process.env.ADMIN_ACCESS_KEY || FALLBACK_ADMIN_ACCESS_KEY;
}

function signPayload(payload: string) {
  return crypto
    .createHmac("sha256", getAdminAccessKey())
    .update(payload)
    .digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function isValidAdminAccessKey(accessKey: string) {
  return safeEqual(accessKey, getAdminAccessKey());
}

export function buildAdminSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({
      sid: crypto.randomUUID(),
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    }),
  ).toString("base64url");

  return `${payload}.${signPayload(payload)}`;
}

function verifyAdminSessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };

    return typeof session.exp === "number" && session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const authenticated = verifyAdminSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  console.log("[admin-auth] verificacion admin", authenticated);
  return authenticated;
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    console.warn("[admin-auth] acceso no autorizado a ruta interna");
    redirect("/admin/login");
  }
}

export async function createAdminSession(response?: NextResponse) {
  const token = buildAdminSessionToken();

  if (response) {
    response.cookies.set(COOKIE_NAME, token, cookieOptions);
  } else {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, cookieOptions);
  }

  console.log("[admin-auth] cookie admin creada");
}

export async function clearAdminSession(response?: NextResponse) {
  const options = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  } as const;

  if (response) {
    response.cookies.set(COOKIE_NAME, "", options);
  } else {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "", options);
  }
}
