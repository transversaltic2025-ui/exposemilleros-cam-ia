import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isProjectEditingEnabled, isProjectRegistrationEnabled } from "@/lib/system-config";
import { InscripcionForm } from "./inscripcion-form";

export const dynamic = "force-dynamic";

export default async function InscripcionPage() {
  const [registrationEnabled, editingEnabled] = await Promise.all([isProjectRegistrationEnabled(), isProjectEditingEnabled()]);
  return <SiteShell><div className="mx-auto max-w-5xl">
    <div className="mb-8"><p className="expo-eyebrow">Registro público</p><h1 className="expo-page-title mt-2">Inscripción de proyectos</h1></div>
    {registrationEnabled ? <Card><CardHeader><CardTitle>Datos del proyecto</CardTitle></CardHeader><CardContent><InscripcionForm /></CardContent></Card> : <Card><CardHeader><CardTitle>Inscripción de proyectos cerrada</CardTitle></CardHeader><CardContent className="grid gap-4"><p className="text-sm leading-6 text-[var(--color-muted)]">El proceso de inscripción pública de proyectos se encuentra cerrado. Si requiere información adicional, comuníquese con el equipo organizador.</p><Link href="/" className="inline-flex h-11 w-fit items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white">Volver al inicio</Link></CardContent></Card>}
    <Card className="mt-6"><CardHeader><CardTitle>¿Ya inscribió su proyecto?</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm text-[var(--color-muted)]">
      <p>Si necesita corregir información o reemplazar el póster de un proyecto ya registrado, puede ingresar con el código del proyecto y el documento de un integrante.</p>
      {editingEnabled ? <Link href="/inscripcion/editar" className="inline-flex h-11 w-fit items-center rounded-xl border border-[var(--color-border)] px-4 font-bold text-[var(--color-primary)]">Editar inscripción</Link> : <p className="font-semibold">La edición pública de inscripciones se encuentra cerrada.</p>}
    </CardContent></Card>
  </div></SiteShell>;
}
