import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isProjectEditingEnabled } from "@/lib/system-config";
import { EditRegistrationAccess } from "./edit-registration-access";

export const dynamic = "force-dynamic";

export default async function EditRegistrationPage() {
  const enabled = await isProjectEditingEnabled();
  return <SiteShell><div className="mx-auto max-w-5xl">
    <p className="expo-eyebrow">Inscripción existente</p>
    <h1 className="expo-page-title mt-2">Editar inscripción del proyecto</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">Si necesita corregir información de un proyecto ya inscrito, ingrese el código del proyecto y el número de documento de una persona registrada en el equipo.</p>
    <Card className="mt-8">
      <CardHeader><CardTitle>{enabled ? "Validar acceso" : "Edición de inscripciones cerrada"}</CardTitle></CardHeader>
      <CardContent>{enabled ? <EditRegistrationAccess /> : <div className="grid gap-4">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950">El proceso de edición pública de inscripciones se encuentra cerrado. Si requiere una corrección, comuníquese con el equipo organizador.</p>
        <Link href="/" className="inline-flex h-11 w-fit items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white">Volver al inicio</Link>
      </div>}</CardContent>
    </Card>
  </div></SiteShell>;
}
