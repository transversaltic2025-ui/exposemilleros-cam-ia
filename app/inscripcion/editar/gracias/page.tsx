import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function EditSuccessPage() {
  return <SiteShell><Card className="mx-auto max-w-2xl"><CardContent className="py-10 text-center">
    <CheckCircle2 className="mx-auto mb-4 size-12 text-[var(--color-success)]" />
    <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">Inscripción actualizada correctamente</h1>
    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">Los cambios del proyecto fueron guardados correctamente. El equipo organizador verá la versión actualizada en el panel administrativo.</p>
    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white" href="/inscripcion/editar">Editar otro proyecto</Link><Link className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold" href="/">Volver al inicio</Link></div>
  </CardContent></Card></SiteShell>;
}
