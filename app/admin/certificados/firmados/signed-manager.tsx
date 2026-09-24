"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { normalizeDocument } from "@/lib/certificates/signed-matching";
import type { AssociationError, SignedCertificate, UploadResult } from "@/types/signed-certificate";

const field = "w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm";
type UploadFields = { certificadoId: string; archivo: FileList; reemplazar: boolean };
type ZipReport = { results: UploadResult[]; resumen: Record<string, number> };

export function SignedManager({ certificates, errors, errorCount, initialStatus }: { certificates: SignedCertificate[]; errors: AssociationError[]; errorCount: number; initialStatus: string }) {
  const router = useRouter();
  const individual = useForm<UploadFields>();
  const zip = useForm<UploadFields>();
  const [search, setSearch] = useState({ documento: "", nombre: "", tipo: "", proyecto: "" });
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<ZipReport | null>(null);
  const [errorId, setErrorId] = useState("");
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtered = certificates.filter(row =>
    (!search.documento || normalizeDocument(row.documento_persona).includes(normalizeDocument(search.documento))) &&
    normalize(row.nombre_persona ?? "").includes(normalize(search.nombre)) &&
    (!search.tipo || row.tipo_certificado === search.tipo) &&
    normalize(row.proyecto_codigo ?? row.codigo_proyecto ?? "").includes(normalize(search.proyecto)));
  const rows = filtered.filter(row => status === "Todos" || (row.estado_firma ?? "Pendiente de firma") === status);
  const signed = certificates.filter(row => row.estado_firma === "Firmado" && row.certificado_firmado_path).length;

  async function upload(values: UploadFields, bulk: boolean) {
    const file = values.archivo?.[0];
    if (!file) { setMessage("Seleccione un archivo."); return; }
    if (file.size > (bulk ? 50 : 15) * 1024 * 1024 || !(bulk ? /\.zip$/i : /\.pdf$/i).test(file.name)) {
      setMessage(bulk ? "Seleccione un ZIP de máximo 50 MB." : "Seleccione un PDF de máximo 15 MB."); return;
    }
    if (values.reemplazar && !window.confirm(bulk ? "¿Confirma reemplazar los certificados firmados existentes que coincidan con este ZIP?" : "¿Confirma reemplazar el certificado firmado seleccionado?")) return;
    setBusy(true); setMessage("");
    if (bulk) setReport(null);
    try {
      const form = new FormData();
      form.set("archivo", file); form.set("reemplazar", String(Boolean(values.reemplazar)));
      if (!bulk) { form.set("certificadoId", values.certificadoId); if (errorId) form.set("errorId", errorId); }
      const response = await fetch(`/api/admin/certificados/firmados/${bulk ? "upload-zip" : "upload"}`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No se pudo completar la carga.");
      if (bulk) { setReport(result); zip.reset(); setMessage("Carga ZIP procesada. Revise el resultado de cada archivo."); }
      else { setMessage(result.message); individual.reset(); setErrorId(""); }
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo completar la carga. Intente nuevamente."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Certificados generados", certificates.filter(row => row.url_certificado || row.estado_certificado === "Generado" || row.archivo_certificado_url).length],
      ["Pendientes de firma", certificates.filter(row => !row.certificado_firmado_path && (!row.estado_firma || row.estado_firma === "Pendiente de firma")).length],
      ["Certificados firmados", signed], ["Errores de asociación", errorCount + certificates.filter(row => row.estado_firma === "Error de asociación").length],
    ].map(([label, count]) => <Card key={label}><CardContent className="pt-5"><p className="text-sm">{label}</p><p className="mt-2 text-3xl font-bold">{count}</p></CardContent></Card>)}</div>
    <p role="status" aria-live="polite" className="font-medium">{busy ? "Procesando archivos. Espere a que termine la carga…" : message}</p>
    <Card id="individual"><CardHeader><CardTitle>Subir certificado firmado individual</CardTitle></CardHeader><CardContent>
      <fieldset disabled={busy} className="space-y-4"><legend className="mb-3 font-semibold">Buscar certificado</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label>Documento<input className={field} inputMode="numeric" value={search.documento} onChange={e => setSearch({ ...search, documento: e.target.value })} /></label>
          <label>Nombre<input className={field} value={search.nombre} onChange={e => setSearch({ ...search, nombre: e.target.value })} /></label>
          <label>Tipo certificado<select className={field} value={search.tipo} onChange={e => setSearch({ ...search, tipo: e.target.value })}><option value="">Todos</option>{[...new Set(certificates.map(row => row.tipo_certificado).filter(Boolean))].map(type => <option key={type}>{type}</option>)}</select></label>
          <label>Código proyecto, si aplica<input className={field} value={search.proyecto} onChange={e => setSearch({ ...search, proyecto: e.target.value })} /></label>
        </div>
        <form onSubmit={individual.handleSubmit(values => upload(values, false))} className="space-y-4">
          <label className="block">Seleccionar certificado<select required className={field} {...individual.register("certificadoId", { required: true })}><option value="">Seleccione un certificado</option>{filtered.map(row => <option key={row.id} value={row.id}>{row.documento_persona} · {row.nombre_persona} · {row.tipo_certificado} · {row.proyecto_codigo ?? row.id} · {row.estado_firma ?? "Pendiente de firma"}</option>)}</select></label>
          {errorId && <p className="rounded-xl bg-amber-50 p-3">Resolviendo: {errors.find(row => row.id === errorId)?.archivo}. Seleccione el registro correcto y vuelva a adjuntar ese PDF. <button type="button" className="underline" onClick={() => setErrorId("")}>Cancelar resolución</button></p>}
          <label className="block">PDF firmado (máximo 15 MB)<input required type="file" accept=".pdf,application/pdf" className={field} {...individual.register("archivo", { required: true })} /></label>
          <label className="flex gap-2"><input type="checkbox" {...individual.register("reemplazar")} />Reemplazar el firmado existente, si lo hay</label>
          <Button type="submit" disabled={busy}>Subir PDF firmado</Button>
        </form>
      </fieldset>
    </CardContent></Card>
    <Card id="zip"><CardHeader><CardTitle>Subir certificados firmados por ZIP</CardTitle></CardHeader><CardContent>
      <p className="mb-4 text-sm">Máximo 50 MB, 200 archivos y 200 MB descomprimidos. Nombre cada PDF con el formato TIPO - NOMBRE COMPLETO - DOCUMENTO.pdf. Ejemplo: Evaluador - Yesny Alejandra Chavez Veloza - 1120563238.pdf. Se aceptan documentos al inicio, en medio o al final; el tipo al inicio permite distinguir los certificados de una misma persona.</p>
      <form onSubmit={zip.handleSubmit(values => upload(values, true))}><fieldset disabled={busy} className="space-y-4">
        <label className="block">Archivo ZIP<input required type="file" accept=".zip,application/zip" className={field} {...zip.register("archivo", { required: true })} /></label>
        <label className="flex gap-2"><input type="checkbox" {...zip.register("reemplazar")} />Reemplazar los firmados existentes que coincidan</label>
        <Button type="submit" disabled={busy}>Subir ZIP</Button>
      </fieldset></form>
      {report && <div className="mt-6 space-y-4"><div className="flex flex-wrap gap-4">{Object.entries({ "PDFs procesados": report.resumen.procesados, "Asociados correctamente": report.resumen.asociados, "No asociados": report.resumen.noAsociados, Duplicados: report.resumen.duplicados, Reemplazados: report.resumen.reemplazados, Errores: report.resumen.errores }).map(([key, value]) => <p key={key}>{key}: <b>{value}</b></p>)}</div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Archivo", "Documento detectado", "Certificado asociado", "Estado", "Motivo"].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{report.results.map((row, index) => <tr key={index} className="border-t"><td className="p-2 break-all">{row.archivo}</td><td className="p-2">{row.documento || "No detectado"}</td><td className="p-2">{row.certificado ?? "Sin asociación"}</td><td className="p-2">{row.estado}</td><td className="p-2">{row.motivo}</td></tr>)}</tbody></table></div></div>}
    </CardContent></Card>
    {errors.length > 0 && <Card><CardHeader><CardTitle>Errores de asociación pendientes</CardTitle></CardHeader><CardContent><p className="mb-3 text-sm">Mostrando los {errors.length} errores más recientes de {errorCount}. Los archivos no asociados deben adjuntarse nuevamente al resolverlos.</p><ul className="space-y-3">{errors.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><StatusPill status="Error de asociación" /><p className="break-all font-semibold">{row.archivo}</p><p>{row.documento} · {row.motivo}</p></div><Button disabled={busy} variant="outline" onClick={() => { setErrorId(row.id); individual.reset(); setSearch({ documento: row.documento, nombre: "", tipo: "", proyecto: "" }); document.getElementById("individual")?.scrollIntoView({ behavior: "smooth" }); }}>Resolver manualmente</Button></li>)}</ul></CardContent></Card>}
    <Card id="listado"><CardHeader><CardTitle>Estado de firma de certificados</CardTitle></CardHeader><CardContent>
      <div className="mb-4 flex flex-wrap gap-3">{["Todos", "Pendiente de firma", "Firmado", "Error de asociación", "Reemplazado"].map(value => <Button key={value} variant={status === value ? "default" : "outline"} onClick={() => setStatus(value)}>{value}</Button>)}</div>
      <p className="mb-3 text-sm">{rows.length} certificados. Se aplican los filtros de búsqueda de la carga individual.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Nombre", "Documento", "Tipo", "Proyecto", "Estado de firma", "Descarga"].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="p-3">{row.nombre_persona}</td><td className="p-3">{row.documento_persona}</td><td className="p-3">{row.tipo_certificado}</td><td className="p-3">{row.proyecto_nombre ?? row.proyecto_codigo ?? "Evento"}</td><td className="p-3"><StatusPill status={row.estado_firma ?? "Pendiente de firma"} /></td><td className="p-3">{row.certificado_firmado_path ? <a className={buttonVariants({ variant: "outline" })} href={`/api/admin/certificados/firmados/descargar?id=${row.id}`}>Descargar firmado</a> : "Pendiente"}</td></tr>)}</tbody></table></div>
    </CardContent></Card>
  </div>;
}
