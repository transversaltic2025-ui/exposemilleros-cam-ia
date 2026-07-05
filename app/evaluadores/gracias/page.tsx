import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function GraciasEvaluadorPage() {
  return (
    <SiteShell>
      <Card className="mx-auto max-w-2xl rounded-lg">
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-10 text-emerald-700" />
          <h1 className="text-2xl font-semibold">Evaluador registrado</h1>
          <p className="mt-3 text-slate-700">
            En la fase real se enviaran enlaces tokenizados para evaluar maximo 3 proyectos del area registrada.
          </p>
          <Link className="mt-6 inline-flex text-sm font-medium text-teal-800 hover:underline" href="/admin/asignaciones">
            Ver asignaciones mock
          </Link>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
