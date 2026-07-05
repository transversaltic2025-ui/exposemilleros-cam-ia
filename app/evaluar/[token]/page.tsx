import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvaluacionByToken } from "@/lib/mock-data";
import { EvaluationForm } from "./evaluation-form";

export default async function EvaluarTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { asignacion, proyecto } = getEvaluacionByToken(token);

  if (!asignacion || !proyecto) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Proyecto asignado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Badge variant="secondary">{proyecto.codigo}</Badge>
            <div>
              <h1 className="text-xl font-semibold">{proyecto.titulo}</h1>
              <p className="mt-2 text-slate-700">{proyecto.resumen}</p>
            </div>
            <div>
              <div className="font-medium">Area</div>
              <div className="text-slate-700">{proyecto.area_conocimiento}</div>
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"
            >
              <ExternalLink className="size-4" />
              Abrir archivo mock
            </a>
            <p className="text-slate-600">
              El evaluador debe abrir y leer el archivo antes de enviar la evaluacion.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Evaluacion humana</CardTitle>
          </CardHeader>
          <CardContent>
            <EvaluationForm />
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
