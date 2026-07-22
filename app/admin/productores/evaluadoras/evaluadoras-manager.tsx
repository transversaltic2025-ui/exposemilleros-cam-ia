"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EvaluadoraProductores } from "@/types/productores";

async function readPayload(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) as Record<string, unknown> : null; } catch { return null; }
}

export function EvaluadorasManager() {
  const [items, setItems] = useState<EvaluadoraProductores[]>([]);
  const [form, setForm] = useState({ nombre: "", documento: "", correo: "", activo: true });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/productores/evaluadoras");
    const data = await readPayload(response);
    if (response.ok) setItems((data?.evaluadoras as EvaluadoraProductores[]) || []);
    else setError(String(data?.error || "No fue posible consultar las evaluadoras."));
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("[evaluadoras] submit");
    setError(""); setSuccess("");
    const requestPayload = { nombre: form.nombre.trim(), documento: form.documento.trim(), correo: form.correo.trim(), activo: form.activo };
    if (requestPayload.nombre.length < 3) { setError("Ingrese el nombre completo de la evaluadora."); return; }
    if (requestPayload.documento.length < 5) { setError("Ingrese el número de documento."); return; }
    if (requestPayload.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestPayload.correo)) { setError("Ingrese un correo electrónico válido."); return; }
    console.log("[evaluadoras] payload", requestPayload);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/productores/evaluadoras", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestPayload) });
      console.log("[evaluadoras] respuesta", response.status);
      const data = await readPayload(response);
      if (!response.ok) { setError(String(data?.error || "No fue posible registrar la evaluadora.")); return; }
      setForm({ nombre: "", documento: "", correo: "", activo: true });
      setSuccess("Evaluadora registrada correctamente.");
      await load();
    } catch (requestError) {
      console.error("[evaluadoras] error de solicitud", requestError);
      setError("No fue posible registrar la evaluadora.");
    } finally { setBusy(false); }
  }

  async function update(item: EvaluadoraProductores, changes: Partial<EvaluadoraProductores>) {
    setError(""); setSuccess("");
    const response = await fetch(`/api/admin/productores/evaluadoras/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: changes.nombre ?? item.nombre, correo: changes.correo ?? item.correo ?? "", activo: changes.activo ?? item.activo }) });
    const data = await readPayload(response);
    if (!response.ok) { setError(String(data?.error || "No fue posible actualizar la evaluadora.")); return; }
    await load();
  }

  function edit(item: EvaluadoraProductores) {
    const nombre = window.prompt("Nombre completo", item.nombre); if (nombre === null) return;
    const correo = window.prompt("Correo electrónico (opcional)", item.correo || ""); if (correo === null) return;
    void update(item, { nombre, correo });
  }

  return <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
    <Card><CardHeader><CardTitle>Registrar evaluadora</CardTitle></CardHeader><CardContent>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div><Label>Nombre completo</Label><Input value={form.nombre} onChange={event => setForm({ ...form, nombre: event.target.value })}/></div>
        <div><Label>Número de documento</Label><Input value={form.documento} onChange={event => setForm({ ...form, documento: event.target.value })}/></div>
        <div><Label>Correo electrónico, opcional</Label><Input type="email" value={form.correo} onChange={event => setForm({ ...form, correo: event.target.value })}/></div>
        <div><Label>Estado</Label><select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={form.activo ? "activa" : "inactiva"} onChange={event => setForm({ ...form, activo: event.target.value === "activa" })}><option value="activa">Activa</option><option value="inactiva">Inactiva</option></select></div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{success}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Registrando..." : "Registrar evaluadora"}</Button>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Evaluadoras registradas</CardTitle></CardHeader><CardContent className="space-y-3">
      {items.map(item => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{item.nombre}</p><p className="text-sm text-[var(--color-muted)]">{item.documento} · {item.correo || "Sin correo"}</p><p className="text-xs text-[var(--color-muted)]">{item.activo ? "Activa" : "Inactiva"} · {item.created_at ? new Date(item.created_at).toLocaleDateString("es-CO") : ""}</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => edit(item)}>Editar</Button><Button type="button" variant="outline" onClick={() => update(item, { activo: !item.activo })}>{item.activo ? "Desactivar" : "Activar"}</Button></div></div></div>)}
    </CardContent></Card>
  </div>;
}
