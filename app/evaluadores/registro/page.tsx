import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENT_DATE_LABEL, isEvaluatorRegistrationOpen } from "@/lib/event-config";
import { getEvaluators } from "@/lib/supabase/queries";
import { EvaluadorForm } from "./evaluador-form";

export const dynamic = "force-dynamic";

export default async function RegistroEvaluadorPage() {
  if (!isEvaluatorRegistrationOpen()) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Inscripción de evaluadores no disponible todavía</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6 text-[var(--color-muted)]">
              <p>
                La inscripción de evaluadores se habilitará el {EVENT_DATE_LABEL}, día del evento, para permitir la
                asignación automática de proyectos disponibles.
              </p>
              <p>Por favor regrese en la fecha indicada para registrar su participación como evaluador.</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
                >
                  Volver al inicio
                </Link>
                <Link
                  href="/evaluadores/recuperar"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--color-border)] bg-white/70 px-4 text-sm font-bold text-[var(--color-text)] hover:bg-white"
                >
                  Recuperar proyectos asignados
                </Link>
              </div>
              <p className="pt-2 font-semibold text-[var(--color-text)]">
                Si ya está registrado, puede recuperar sus proyectos asignados.
              </p>
            </CardContent>
          </Card>
        </div>
      </SiteShell>
    );
  }

  const evaluadores = await getEvaluators();

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="expo-eyebrow">Evaluadores</p>
          <h1 className="expo-page-title mt-2">Registro de evaluadores</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
            Los evaluadores no tendrán login. Recibirán enlaces de evaluación por token según su área de conocimiento.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Datos del evaluador</CardTitle>
            </CardHeader>
            <CardContent>
              <EvaluadorForm />
              <Link
                className="mt-5 inline-flex text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)]"
                href="/evaluadores/recuperar"
              >
                ¿Ya estás registrado? Recupera tus proyectos asignados
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Disponibilidad por área</CardTitle>
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
