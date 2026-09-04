import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin-auth";
import { listCertificateTemplates } from "@/lib/certificates/templates";
import { createCertificateSignedUrl } from "@/lib/supabase/storage";
import { TemplateManager } from "./template-manager";

export const dynamic = "force-dynamic";

export default async function CertificateTemplatePage() {
  await requireAdmin();
  const { templates, tableMissing } = await listCertificateTemplates();
  const active = templates.find(template => template.activo) ?? null;
  const activeUrl = active ? await createCertificateSignedUrl(active.archivo_path).catch(() => null) : null;

  return <SiteShell>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="expo-eyebrow">Administración</p><h1 className="expo-page-title mt-2">Plantilla PDF de certificados</h1><p className="mt-3 text-sm text-[var(--color-muted)]">Suba el formato PDF oficial que se utilizará como base para generar los certificados.</p></div><Link href="/admin/certificados" className={buttonVariants({ variant: "outline" })}>Volver a certificados</Link></div>
    {tableMissing ? <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">No existe la tabla certificados_plantillas. Ejecute el SQL de configuración antes de subir la plantilla. Archivo: docs/CERTIFICADOS_PLANTILLAS.sql</div> : null}
    {active ? <Card className="mb-6"><CardHeader><CardTitle>Plantilla activa actual</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-4"><p><b>Nombre:</b><br />{active.nombre}</p><p><b>Tipo:</b><br />{active.tipo_certificado}</p><p><b>Fecha de carga:</b><br />{active.created_at ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(active.created_at)) : "Sin fecha"}</p><p><b>Estado:</b><br />Activa</p><div className="flex gap-3 md:col-span-4">{activeUrl ? <Link href={activeUrl} target="_blank" className={buttonVariants({ variant: "outline" })}>Ver plantilla activa</Link> : null}<Link href={`/api/admin/certificates/templates/preview?tipo=${encodeURIComponent(active.tipo_certificado)}`} target="_blank" className={buttonVariants()}>Generar vista previa</Link></div></CardContent></Card> : null}
    <Card><CardHeader><CardTitle>Gestionar plantilla</CardTitle></CardHeader><CardContent><TemplateManager activeTemplate={active} /></CardContent></Card>
  </SiteShell>;
}
