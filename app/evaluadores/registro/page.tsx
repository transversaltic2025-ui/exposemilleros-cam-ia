import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvaluators } from "@/lib/supabase/queries";
import { EvaluadorForm } from "./evaluador-form";

export const dynamic = "force-dynamic";

export default async function RegistroEvaluadorPage() {
  const evaluadores = await getEvaluators();

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="expo-eyebrow">Evaluadores</p>
          <h1 className="expo-page-title mt-2">Registro de evaluadores</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
            Los evaluadores no tendran login. Recibiran enlaces de evaluacion por token segun su area de conocimiento.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Datos del evaluador</CardTitle>
          </CardHeader>
          <CardContent>
            <EvaluadorForm />
            <Link className="mt-5 inline-flex text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)]" href="/evaluadores/recuperar">
              ¿Ya estás registrado? Recupera tus proyectos asignados
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Disponibilidad por area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {evaluadores.map((evaluador) => (
              <div
                key={evaluador.id ?? evaluador.evaluador_id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white/45 p-3"
              >
                <span className="text-sm font-semibold text-[var(--color-text)]">{evaluador.area_conocimiento}</span>
                <span className="font-sans text-sm font-extrabold text-[var(--color-primary)]">
                  {evaluador.cantidad_proyectos_asignados ?? evaluador.proyectos_asignados ?? 0}/3
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        </div>
      </div>
    </SiteShell>
  );
}
