import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { ScoreOrb } from "@/components/score-orb";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvaluationByToken, shouldUseMockData } from "@/lib/supabase/queries";
import { createProjectFileSignedUrl } from "@/lib/supabase/storage";
import { EvaluationForm } from "./evaluation-form";

export const dynamic = "force-dynamic";

export default async function EvaluarTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { asignacion, proyecto, criterios } = await getEvaluationByToken(token);

  if (!asignacion || !proyecto) {
    notFound();
  }

  const fileUrl = proyecto.archivo_storage_path && !shouldUseMockData()
    ? await createProjectFileSignedUrl(proyecto.archivo_storage_path)
    : proyecto.archivo_url ?? "#";

  return (
    <SiteShell>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Proyecto asignado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <StatusPill>{proyecto.codigo}</StatusPill>
              <ScoreOrb score={null} status={asignacion.estado_asignacion ?? asignacion.estado} size="sm" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-black leading-tight text-[var(--color-text)]">{proyecto.titulo}</h1>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">{proyecto.resumen}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4">
              <div className="expo-eyebrow">Area</div>
              <div className="mt-2 font-sans font-extrabold text-[var(--color-text)]">{proyecto.area_conocimiento}</div>
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 font-bold text-white hover:bg-[var(--color-secondary)]"
            >
              <ExternalLink className="size-4" />
              Abrir archivo
            </a>
            <p className="text-[var(--color-muted)]">
              El evaluador debe abrir y leer el archivo antes de enviar la evaluacion.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluacion humana</CardTitle>
          </CardHeader>
          <CardContent>
            <EvaluationForm token={token} criterios={criterios} />
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
