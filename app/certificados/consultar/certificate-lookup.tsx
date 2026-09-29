"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeDocument } from "@/lib/certificates/signed-matching";
import type { PublicCertificate } from "@/types/signed-certificate";

type Fields = { documento: string };
export function CertificateLookup() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Fields>({ defaultValues: { documento: "" } });
  const [certificates, setCertificates] = useState<PublicCertificate[]>([]);
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState("");
  const clear = () => { setCertificates([]); setMessage(""); setDetail(""); };
  async function lookup(values: Fields) {
    clear();
    const documento = normalizeDocument(values.documento);
    if (!documento) { setMessage("Digite un n\u00famero de documento v\u00e1lido."); return; }
    try {
      const response = await fetch("/api/certificados/consultar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documento }), cache: "no-store" });
      const text = await response.text();
      let result;
      try { result = JSON.parse(text); }
      catch { result = { success: false, message: text || "Respuesta no v\u00e1lida del servidor." }; }
      if (!result || typeof result !== "object") throw new Error("Respuesta no v\u00e1lida del servidor.");
      setMessage(typeof result.message === "string" ? result.message : "Respuesta no v\u00e1lida del servidor.");
      setDetail(typeof result.detail === "string" ? result.detail : "");
      if (!response.ok || !result.success) return;
      if (!Array.isArray(result.results)) throw new Error("Respuesta no v\u00e1lida del servidor.");
      setCertificates(result.results); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No fue posible consultar. Intente nuevamente."); }
  }
  return <div className="space-y-5">
    <Card><CardContent className="pt-6"><form onSubmit={handleSubmit(lookup)} className="space-y-4">
      <fieldset disabled={isSubmitting} className="space-y-4">
        <legend className="mb-3 font-semibold">Buscar por documento</legend>
        <div className="space-y-2">
          <label className="block font-semibold" htmlFor="documento">Número de documento</label>
          <input id="documento" inputMode="numeric" autoComplete="off" maxLength={80} className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3" {...register("documento", { onChange: clear })} />
        </div>
        <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Consultando..." : "Buscar certificados"}</Button>
      </fieldset>
    </form></CardContent></Card>
    <div role="status" aria-live="polite" className="space-y-2"><p>{message}</p>{detail && <p className="break-words text-sm text-red-700">{detail}</p>}</div>
    {certificates.map(row => <Card key={row.id}><CardHeader><CardTitle>{row.nombre_persona}</CardTitle></CardHeader><CardContent className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt className="text-sm text-[var(--color-muted)]">Documento</dt><dd>{row.documento_mostrado}</dd></div>
        <div><dt className="text-sm text-[var(--color-muted)]">Tipo de certificado</dt><dd>{row.tipo_certificado}</dd></div>
        {row.proyecto && <div><dt className="text-sm text-[var(--color-muted)]">Proyecto o iniciativa</dt><dd>{row.proyecto}</dd></div>}
        {row.certificado_firmado_at && <div><dt className="text-sm text-[var(--color-muted)]">Fecha de carga del firmado</dt><dd>{new Date(row.certificado_firmado_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</dd></div>}
      </dl>
      <Button type="button" variant="outline" onClick={() => window.open(row.downloadUrl, "_blank", "noopener,noreferrer")}>Descargar certificado</Button>
    </CardContent></Card>)}
  </div>;
}
