"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProductoresAccessLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ documento: "", clave: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/productores/acceso/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json() as { token?: string; error?: string };
      if (!response.ok || !payload.token) return setError(payload.error || "Documento o clave incorrectos.");
      router.push(`/productores/acceso/panel/${encodeURIComponent(payload.token)}`);
    } catch { setError("No fue posible iniciar el acceso. Intente nuevamente."); }
    finally { setBusy(false); }
  }
  return <Card className="mt-8"><CardContent className="p-6"><form className="space-y-5" onSubmit={submit}>
    <div><Label htmlFor="documento">Número de documento</Label><Input id="documento" autoComplete="username" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} required /></div>
    <div><Label htmlFor="clave">Clave de acceso</Label><Input id="clave" type="password" autoComplete="current-password" value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value })} required /></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <Button className="w-full" disabled={busy}>{busy ? "Validando..." : "Ingresar"}</Button>
  </form></CardContent></Card>;
}
