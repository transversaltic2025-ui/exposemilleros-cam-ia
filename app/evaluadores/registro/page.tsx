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
            Los evaluadores no tendrán login. Recibirán enlaces de evaluación por token según su área de conocimiento.
          </p>
        </div>

        <Card className="mb-6 border-[#2E7D5B]/25 bg-[#2E7D5B]/10">
          <CardHeader>
            <CardTitle>Registro de evaluadores habilitado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-[var(--color-muted)]">
            <p>
              Puede registrar sus datos como evaluador desde este momento. Los proyectos serán asignados automáticamente
              según el perfil y área seleccionada a partir del 5 de agosto de 2026 a las 00:00, hora Colombia, día del
              evento.
            </p>
            <p>
              Una vez habilitada la asignación, podrá ingresar con su documento para consultar los proyectos asignados.
            </p>
            <Link
              href="/evaluadores/recuperar"
              className="inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
            >
              Recuperar acceso a mis proyectos
            </Link>
          </CardContent>
        </Card>

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
              {evaluadores.length > 0 ? evaluadores.map((evaluador) => (
                <div
                  key={evaluador.id ?? evaluador.evaluador_id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white/45 p-3"
                >
                  <span className="text-sm font-semibold text-[var(--color-text)]">{evaluador.area_conocimiento}</span>
                  <span className="font-sans text-sm font-extrabold text-[var(--color-primary)]">
                    {evaluador.cantidad_proyectos_asignados ?? evaluador.proyectos_asignados ?? 0}/3
                  </span>
                </div>
              )) : (
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  Aún no hay evaluadores registrados.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
