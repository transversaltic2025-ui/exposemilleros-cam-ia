"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { normalizeDocument } from "@/lib/certificates/signed-matching";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicCertificate } from "@/types/signed-certificate";

const schema = z.object({ documento: z.string().max(80).refine(value => /^\d{5,25}$/.test(normalizeDocument(value)), "Ingrese un número de documento válido.") });
export function CertificateLookup() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [certificates, setCertificates] = useState<PublicCertificate[]>([]);
  const [message, setMessage] = useState("");
  async function lookup(values: z.infer<typeof schema>) {
    setCertificates([]); setMessage("");
    try {
      const response = await fetch("/api/certificados/consultar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documento: normalizeDocument(values.documento) }), cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setCertificates(result.certificados); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No fue posible consultar. Intente nuevamente."); }
  }
  return <div className="space-y-5"><Card><CardContent className="pt-6"><form onSubmit={handleSubmit(lookup)} className="space-y-4">
    <label className="block font-semibold" htmlFor="documento">Número de documento</label>
    <input id="documento" inputMode="numeric" autoComplete="off" maxLength={80} className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3" aria-invalid={Boolean(errors.documento)} aria-describedby="documento-error" {...register("documento", { onChange: () => { setCertificates([]); setMessage(""); } })} />
    <p id="documento-error" className="text-sm text-red-700">{errors.documento?.message}</p>
    <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Consultando…" : "Consultar certificados"}</Button>
  </form></CardContent></Card><p role="status" aria-live="polite">{message}</p>
    {[...new Set(certificates.map(row => row.nombre_persona))].map(name => <Card key={name}><CardHeader><CardTitle>{name}</CardTitle></CardHeader><CardContent><p className="mb-4 font-semibold">Certificados disponibles</p><ul className="space-y-4">{certificates.filter(row => row.nombre_persona === name).map((row, index) => <li key={index} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-semibold">{row.tipo_certificado}{row.proyecto ? ` — ${row.proyecto}` : ""}</p>{row.fecha_generacion && <p className="text-sm text-[var(--color-muted)]">Generado: {new Date(row.fecha_generacion).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}</p>}</div><a href={row.descarga} rel="noreferrer" className={buttonVariants({ variant: "outline" })}>Descargar certificado</a></li>)}</ul></CardContent></Card>)}
  </div>;
}
