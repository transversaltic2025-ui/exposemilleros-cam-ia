import "server-only";

import crypto from "node:crypto";

const tokenSecret = () =>
  process.env.PRODUCTORES_TOKEN_SECRET ||
  process.env.ADMIN_ACCESS_KEY ||
  "expo-productores-2026";

export function createEvaluadoraToken(id: string) {
  const payload = Buffer.from(
    JSON.stringify({ id, exp: Date.now() + 8 * 60 * 60 * 1000 }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", tokenSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function readEvaluadoraToken(token: string) {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expected = crypto
      .createHmac("sha256", tokenSecret())
      .update(payload)
      .digest("base64url");

    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null;
    }

    const value = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { id: string; exp: number };

    return value.exp > Date.now() ? value : null;
  } catch {
    return null;
  }
}
