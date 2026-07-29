"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Access = { id: string; nombre: string; documento: string; correo?: string | null; activo: boolean; ultimo_acceso?: string | null; created_at: string };
const read = async (response: Response) => { const value = await response.text(); try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; } };
const date = (value?: string | null) => value ? new Date(value).toLocaleString("es-CO") : "Nunca";

export function AccesosProductoresManager() {
  const [items, setItems] = useState<Access[]>([]);
  const [form, setForm] = useState({ nombre: "", documento: "", correo: "", clave: "" });
  const [message, setMessage] = useState({ error: "", success: "" });
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/productores/accesos", { cache: "no-store" });
    const payload = await read(response);
    if (response.ok) setItems((payload.accesos as Access[]) || []);
    else setMessage({ error: String(payload.error || "No fue posible consultar los accesos."), success: "" });
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage({ error: "", success: "" });
    try {
      const response = await fetch("/api/admin/productores/accesos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await read(response);
      if (!response.ok) return setMessage({ error: String(payload.error || "No fue posible crear el acceso."), success: "" });
      setForm({ nombre: "", documento: "", correo: "", clave: "" });
      setMessage({ error: "", success: "Acceso creado correctamente." });
      await load();
    } finally { setBusy(false); }
  }

  async function update(item: Access, changes: Record<string, unknown>, success: string) {
    setMessage({ error: "", success: "" });
    const response = await fetch(`/api/admin/productores/accesos/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    const payload = await read(response);
    if (!response.ok) return setMessage({ error: String(payload.error || "No fue posible actualizar el acceso."), success: "" });
    setMessage({ error: "", success }); await load();
  }

  function reset(item: Access) {
    const nueva = window.prompt("Ingrese la nueva clave temporal (mínimo 8 caracteres):");
    if (nueva === null) return;
    void update(item, { nueva_clave: nueva }, "Clave restablecida correctamente. El token anterior fue invalidado.");
  }

  return <div className="mt-8 grid gap-6 xl:grid-cols-[380px_1fr]">
    <Card><CardHeader><CardTitle>Crear acceso</CardTitle></CardHeader><CardContent>
      <form className="space-y-4" onSubmit={submit}>
        <div><Label htmlFor="nombre">Nombre completo</Label><Input id="nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
        <div><Label htmlFor="documento">Número de documento</Label><Input id="documento" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} required /></div>
        <div><Label htmlFor="correo">Correo electrónico, opcional</Label><Input id="correo" type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} /></div>
        <div><Label htmlFor="clave">Clave temporal</Label><Input id="clave" type="password" minLength={8} value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value })} required /></div>
        {message.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message.error}</p>}
        {message.success && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message.success}</p>}
        <Button disabled={busy}>{busy ? "Creando..." : "Crear acceso"}</Button>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Accesos registrados</CardTitle></CardHeader><CardContent>
      <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Documento</TableHead><TableHead>Correo</TableHead><TableHead>Estado</TableHead><TableHead>Último acceso</TableHead><TableHead>Creación</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
      <TableBody>{items.map(item => <TableRow key={item.id}><TableCell className="font-bold">{item.nombre}</TableCell><TableCell>{item.documento}</TableCell><TableCell>{item.correo || "Sin correo"}</TableCell><TableCell>{item.activo ? "Activo" : "Inactivo"}</TableCell><TableCell>{date(item.ultimo_acceso)}</TableCell><TableCell>{date(item.created_at)}</TableCell><TableCell><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void update(item, { activo: !item.activo }, item.activo ? "Acceso desactivado." : "Acceso activado.")}>{item.activo ? "Desactivar" : "Activar"}</Button><Button size="sm" variant="outline" onClick={() => reset(item)}>Restablecer clave</Button></div></TableCell></TableRow>)}</TableBody></Table>
      {!items.length && <p className="py-8 text-center text-[var(--color-muted)]">No hay accesos registrados.</p>}
    </CardContent></Card>
  </div>;
}
