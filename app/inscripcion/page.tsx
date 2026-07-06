import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InscripcionForm } from "./inscripcion-form";

export default function InscripcionPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="expo-eyebrow">Registro publico</p>
          <h1 className="expo-page-title mt-2">Inscripcion de proyectos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Registro publico de proyectos con almacenamiento en Supabase Database y Supabase Storage.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Datos del proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <InscripcionForm />
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
