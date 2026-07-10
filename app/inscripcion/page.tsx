import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InscripcionForm } from "./inscripcion-form";

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
      </div>
    </SiteShell>
  );
}
