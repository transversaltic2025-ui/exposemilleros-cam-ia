import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";
import { isProjectEditingEnabled } from "@/lib/system-config";

export const dynamic = "force-dynamic";

export default async function GraciasInscripcionPage() {
  const enabled = await isProjectEditingEnabled();
  return <SiteShell><Card className="mx-auto max-w-2xl"><CardContent className="py-10 text-center">
    <CheckCircle2 className="mx-auto mb-4 size-12 text-[var(--color-success)]" />
    <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">Proyecto recibido</h1>
    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">El registro fue recibido correctamente. El equipo organizador revisará la información registrada.</p>
    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">Guarde la información enviada y esté atento a las comunicaciones del evento.</p>
    {enabled ? <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">Si necesita corregir la información enviada o reemplazar el póster, puede hacerlo desde la opción Editar inscripción.</p> : <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">La edición pública de inscripciones se encuentra cerrada.</p>}
    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
      <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white" href="/inscripcion">Registrar otro proyecto</Link>
      {enabled ? <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-primary)]" href="/inscripcion/editar">Editar inscripción</Link> : null}
      <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-primary)]" href="/">Volver al inicio</Link>
    </div>
  </CardContent></Card></SiteShell>;
}
