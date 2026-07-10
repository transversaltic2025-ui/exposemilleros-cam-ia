import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecoverAccessForm } from "./recover-access-form";

export default function RecuperarEvaluadorPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="expo-eyebrow">Evaluadores</p>
          <h1 className="expo-page-title mt-2">Recuperar acceso / consultar mis proyectos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Ingrese su número de documento para consultar su registro y sus proyectos asignados cuando estén disponibles.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Buscar acceso</CardTitle>
          </CardHeader>
          <CardContent>
            <RecoverAccessForm />
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
