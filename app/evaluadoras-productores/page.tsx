import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvaluadoraLogin } from "@/app/productores/evaluacion/evaluadora-login";

export default function EvaluadorasProductoresPage() {
  return <SiteShell>
    <Card className="mx-auto max-w-lg">
      <CardHeader><CardTitle>Acceso evaluadoras de productores</CardTitle></CardHeader>
      <CardContent><EvaluadoraLogin /></CardContent>
    </Card>
  </SiteShell>;
}
