import { EvaluadoraLogin } from "./evaluadora-login";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductoresEvaluationAccessPage() {
  return (
    <SiteShell>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Acceso evaluadores de productores campesinos</CardTitle>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Ingrese su número de documento para acceder al panel de evaluación de iniciativas productivas campesinas.
          </p>
        </CardHeader>
        <CardContent><EvaluadoraLogin /></CardContent>
      </Card>
    </SiteShell>
  );
}
