import { createHash } from "node:crypto";

const attempts = new Map<string, { count: number; until: number }>();
// Per-instance fallback; production proxies must also enforce distributed limits.
export function allowCertificateLookup(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = createHash("sha256").update(address).digest("hex");
  const now = Date.now();
  for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id);
  const current = attempts.get(key);
  if (current) { current.count++; return current.count <= 20; }
  if (attempts.size >= 10000) return false;
  attempts.set(key, { count: 1, until: now + 60000 });
  return true;
}
