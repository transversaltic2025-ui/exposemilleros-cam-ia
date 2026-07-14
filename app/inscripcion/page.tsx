import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InscripcionForm } from "./inscripcion-form";
import Link from "next/link";

export default function InscripcionPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="expo-eyebrow">Registro publico</p>
          <h1 className="expo-page-title mt-2">Inscripción de proyectos</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Datos del proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <InscripcionForm />
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader><CardTitle>¿Ya inscribió su proyecto?</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm text-[var(--color-muted)]">
            <p>Si necesita corregir información o reemplazar el póster de un proyecto ya registrado, puede ingresar con el código del proyecto y el documento de un integrante.</p>
            <Link href="/inscripcion/editar" className="inline-flex h-11 w-fit items-center rounded-xl border border-[var(--color-border)] px-4 font-bold text-[var(--color-primary)]">Editar inscripción</Link>
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
