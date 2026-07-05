import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InscripcionForm } from "./inscripcion-form";

export default function InscripcionPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Inscripcion de proyectos</h1>
          <p className="mt-2 text-slate-700">
            Registro mock para proyectos del evento. La conexion con Google Sheets y Google Drive se hara en la siguiente fase.
          </p>
        </div>
        <Card className="rounded-lg">
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
