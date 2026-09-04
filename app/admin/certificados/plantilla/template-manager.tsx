"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CERTIFICATE_TEMPLATE_TYPES, DEFAULT_TEXT_POSITIONS, type CertificateTemplate } from "@/types/certificate-template";

export function TemplateManager({ activeTemplate }: { activeTemplate: CertificateTemplate | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("archivo");
    if (!(file instanceof File) || file.type !== "application/pdf") return setMessage("Solo se permite subir archivos PDF.");
    if (file.size > 10 * 1024 * 1024) return setMessage("El archivo supera el tamaño máximo permitido.");
    data.set("activo", data.get("activo") ? "true" : "false");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/certificates/templates", { method: "POST", body: data });
      const payload = await response.json() as { error?: string };
      setMessage(response.ok ? "Plantilla subida correctamente." : payload.error || "No se pudo subir la plantilla.");
      if (response.ok) { form.reset(); router.refresh(); }
    } finally { setBusy(false); }
  }

  async function savePositions(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTemplate) return;
    setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    try {
      const response = await fetch("/api/admin/certificates/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: activeTemplate.id,
          nombre: { x: Number(values.nombreX), y: Number(values.nombreY), size: Number(values.nombreSize), maxWidth: Number(values.nombreMaxWidth) },
          documento: { x: Number(values.documentoX), y: Number(values.documentoY), size: Number(values.documentoSize), maxWidth: Number(values.documentoMaxWidth) },
          rol: { x: Number(values.rolX), y: Number(values.rolY), size: Number(values.rolSize), maxWidth: Number(values.rolMaxWidth) },
        }),
      });
      const payload = await response.json() as { error?: string };
      setMessage(response.ok ? "Posiciones guardadas correctamente." : payload.error || "No se pudieron guardar las posiciones.");
      if (response.ok) router.refresh();
    } finally { setBusy(false); }
  }

  const saved = activeTemplate?.posiciones;
  const usesPreviousDefaults = saved?.nombre?.x === 420 && saved.nombre.y === 390 &&
    saved?.documento?.x === 420 && saved.documento.y === 360 &&
    saved?.rol?.x === 420 && saved.rol.y === 295;
  const name = usesPreviousDefaults ? DEFAULT_TEXT_POSITIONS.nombre : { ...DEFAULT_TEXT_POSITIONS.nombre, ...(saved?.nombre ?? {}) };
  const documentPosition = usesPreviousDefaults ? DEFAULT_TEXT_POSITIONS.documento : { ...DEFAULT_TEXT_POSITIONS.documento, ...(saved?.documento ?? {}) };
  const role = usesPreviousDefaults ? DEFAULT_TEXT_POSITIONS.rol : { ...DEFAULT_TEXT_POSITIONS.rol, ...(saved?.rol ?? {}) };
  const field = (id: string, label: string, value: number) => <div key={id}><Label htmlFor={id}>{label}</Label><Input id={id} name={id} type="number" step="0.5" required defaultValue={value} className="mt-2" /></div>;

  return <div className="space-y-8">
    <form onSubmit={upload} className="grid gap-5 md:grid-cols-2">
      <div><Label htmlFor="nombre">Nombre de la plantilla</Label><Input id="nombre" name="nombre" required className="mt-2" /></div>
      <div><Label htmlFor="tipo_certificado">Tipo de certificado</Label><select id="tipo_certificado" name="tipo_certificado" className="mt-2 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm" defaultValue="General">{CERTIFICATE_TEMPLATE_TYPES.map(type => <option key={type}>{type}</option>)}</select></div>
      <div className="md:col-span-2"><Label htmlFor="archivo">Archivo PDF (máximo 10 MB)</Label><Input id="archivo" name="archivo" type="file" accept="application/pdf,.pdf" required className="mt-2" /></div>
      <label className="flex items-center gap-2 text-sm font-bold"><input name="activo" type="checkbox" defaultChecked className="size-4 accent-[var(--color-primary)]" /> Activar como plantilla oficial</label>
      <div className="md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Subiendo..." : "Subir plantilla"}</Button></div>
    </form>

    <div className="border-t border-[var(--color-border)] pt-7">
      <h2 className="font-sans text-xl font-extrabold">Ajustar posición de textos</h2>
      {activeTemplate ? <form onSubmit={savePositions} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <p className="font-bold sm:col-span-2 lg:col-span-4">Nombre</p>
        {field("nombreX", "Nombre X", name.x)}{field("nombreY", "Nombre Y", name.y)}{field("nombreSize", "Tamaño nombre", name.size)}{field("nombreMaxWidth", "Ancho máximo nombre", name.maxWidth)}
        <p className="mt-2 font-bold sm:col-span-2 lg:col-span-4">Documento</p>
        {field("documentoX", "Documento X", documentPosition.x)}{field("documentoY", "Documento Y", documentPosition.y)}{field("documentoSize", "Tamaño documento", documentPosition.size)}{field("documentoMaxWidth", "Ancho máximo documento", documentPosition.maxWidth)}
        <p className="mt-2 font-bold sm:col-span-2 lg:col-span-4">Rol</p>
        {field("rolX", "Rol X", role.x)}{field("rolY", "Rol Y", role.y)}{field("rolSize", "Tamaño rol", role.size)}{field("rolMaxWidth", "Ancho máximo rol", role.maxWidth)}
        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4"><Button type="submit" disabled={busy}>Guardar posiciones</Button><Button type="button" variant="outline" onClick={() => window.open(`/api/admin/certificates/templates/preview?tipo=${encodeURIComponent(activeTemplate.tipo_certificado)}`, "_blank")}>Generar vista previa</Button><Button type="button" variant="outline" onClick={() => window.open(`/api/admin/certificates/templates/preview?tipo=${encodeURIComponent("Líder de proyecto")}`, "_blank")}>Vista previa: Líder de proyecto</Button></div>
      </form> : <p className="mt-3 text-sm text-[var(--color-muted)]">Active una plantilla para configurar las posiciones.</p>}
    </div>
    {message ? <p role="status" className="rounded-xl bg-white/70 p-3 text-sm font-bold">{message}</p> : null}
  </div>;
}
