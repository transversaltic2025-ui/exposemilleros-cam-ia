import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { evaluadoresMock } from "@/lib/mock-data";
import { EvaluadorForm } from "./evaluador-form";

export default function RegistroEvaluadorPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Registro de evaluadores</h1>
          <p className="mt-2 text-slate-700">
            Los evaluadores no tendran login. Recibiran enlaces de evaluacion por token segun su area de conocimiento.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Datos del evaluador</CardTitle>
          </CardHeader>
          <CardContent>
            <EvaluadorForm />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Disponibilidad mock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {evaluadoresMock.map((evaluador) => (
              <div key={evaluador.evaluador_id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0">
                <span>{evaluador.area_conocimiento}</span>
                <span className="font-medium">{evaluador.proyectos_asignados}/3</span>
              </div>
            ))}
          </CardContent>
        </Card>
        </div>
      </div>
    </SiteShell>
  );
}
