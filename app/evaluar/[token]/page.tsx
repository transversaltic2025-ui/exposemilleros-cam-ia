import { ExternalLink } from "lucide-react";
import Link from "next/link";

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
  const { asignacion, proyecto, evaluador, criterios } = await getEvaluationByToken(token);

  if (!asignacion) {
    return <EvaluationAccessMessage message="No se encontró una asignación válida para este enlace." />;
  }
  if (!proyecto) {
    return <EvaluationAccessMessage message="Este enlace no corresponde a una asignación disponible." />;
  }

  const poster = await resolvePoster(proyecto, token);
  const evaluatorAccessUrl = evaluador?.token_acceso
    ? `/evaluadores/mis-asignaciones/${evaluador.token_acceso}`
    : "/evaluadores/registro";
  const assignmentStatus = (asignacion.estado_asignacion ?? asignacion.estado ?? "Pendiente").toLowerCase();
  const evaluationCompleted = ["completada", "finalizada"].includes(assignmentStatus);
  const assignmentInactive = ["cancelada", "eliminada", "anulada", "inactiva"].includes(assignmentStatus);
  const assignmentAvailable = ["pendiente", "en proceso", "completada", "finalizada"].includes(assignmentStatus);

  if (assignmentInactive) {
    return <EvaluationAccessMessage message="La asignación se encuentra inactiva." />;
  }
  if (!assignmentAvailable) {
    return <EvaluationAccessMessage message="Este enlace no corresponde a una asignación disponible." />;
  }
  if (evaluationCompleted && asignacion.permitir_edicion !== true) {
    return (
      <SiteShell>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-10 text-center">
            <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">
              Esta evaluación ya fue registrada.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Puedes volver a tu módulo de proyectos asignados para revisar el estado de tus evaluaciones.
            </p>
            <Link
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
              href={evaluatorAccessUrl}
            >
              Volver a mis proyectos asignados
            </Link>
          </CardContent>
        </Card>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Proyecto asignado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <StatusPill>{proyecto.codigo}</StatusPill>
              <ScoreOrb score={null} status={asignacion.estado_asignacion ?? asignacion.estado} size="sm" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-black leading-tight text-[var(--color-text)]">{proyecto.titulo}</h1>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">{proyecto.resumen}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4">
              <div className="expo-eyebrow">Área</div>
              <div className="mt-2 font-sans font-extrabold text-[var(--color-text)]">{proyecto.area_conocimiento}</div>
            </div>

            <section className="border-t border-[var(--color-border)] pt-5">
              <h2 className="font-heading text-2xl font-black text-[var(--color-text)]">Póster del proyecto</h2>
              {poster ? (
                <div className="mt-4 space-y-4">
                  {poster.kind === "image" ? (
                    <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                      <img
                        src={poster.url}
                        alt={proyecto.poster_proyecto_nombre || `Póster del proyecto ${proyecto.codigo}`}
                        className="max-h-[900px] w-full rounded-xl object-contain"
                      />
                    </div>
                  ) : poster.kind === "pdf" ? (
                    <iframe
                      src={poster.url}
                      title={`Póster del proyecto ${proyecto.codigo}`}
                      className="h-[500px] w-full rounded-2xl border border-[var(--color-border)] bg-white shadow-sm md:h-[700px]"
                    />
                  ) : null}
                  <a
                    href={poster.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] bg-white px-4 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    <ExternalLink className="size-4" />
                    Abrir póster en nueva pestaña
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--color-muted)]">Este proyecto no tiene póster cargado.</p>
              )}
            </section>

            <p className="text-[var(--color-muted)]">
              Revise el póster y la información del proyecto antes de enviar la evaluación.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluación humana</CardTitle>
          </CardHeader>
          <CardContent>
            <EvaluationForm token={token} criterios={criterios} />
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}

type EvaluationProject = NonNullable<Awaited<ReturnType<typeof getEvaluationByToken>>["proyecto"]>;
type PosterView = { url: string; kind: "image" | "pdf" | "other" };

async function resolvePoster(proyecto: EvaluationProject, token: string): Promise<PosterView | null> {
  const currentPath = `/evaluar/${token}`;
  const candidates = [
    {
      path: proyecto.poster_proyecto_path?.trim(),
      type: proyecto.poster_proyecto_tipo,
      name: proyecto.poster_proyecto_nombre,
    },
    {
      path: proyecto.archivo_proyecto_path?.trim() || proyecto.archivo_storage_path?.trim(),
      url: proyecto.archivo_proyecto_url?.trim() || proyecto.archivo_url?.trim(),
      type: proyecto.archivo_proyecto_tipo,
      name: proyecto.archivo_proyecto_nombre,
    },
  ];

  for (const candidate of candidates) {
    let url = candidate.url;
    if (candidate.path) {
      try {
        url = /^https?:\/\//i.test(candidate.path)
          ? candidate.path
          : shouldUseMockData()
            ? undefined
            : await createProjectFileSignedUrl(candidate.path);
      } catch (error) {
        console.error("[evaluar/poster] No se pudo generar URL firmada", error);
        url = candidate.url;
      }
    }
    if (!isValidPosterUrl(url, currentPath)) continue;
    return {
      url,
      kind: detectPosterKind(candidate.type, candidate.name, candidate.path, url),
    };
  }
  return null;
}

function isValidPosterUrl(value: string | undefined, currentPath: string): value is string {
  if (!value || value === "#" || value === currentPath || value.startsWith("/evaluar/")) return false;
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.pathname !== currentPath &&
      !url.pathname.startsWith("/evaluar/")
    );
  } catch {
    return false;
  }
}

function detectPosterKind(
  type?: string,
  name?: string,
  path?: string,
  url?: string,
): PosterView["kind"] {
  const mime = type?.toLowerCase() ?? "";
  if (["image/jpeg", "image/png", "image/webp"].includes(mime)) return "image";
  if (mime === "application/pdf") return "pdf";
  const source = `${name ?? ""} ${path ?? ""} ${url ?? ""}`.toLowerCase().split("?")[0];
  if (/\.(jpe?g|png|webp)(\s|$)/.test(source)) return "image";
  if (/\.pdf(\s|$)/.test(source)) return "pdf";
  return "other";
}

function EvaluationAccessMessage({ message }: { message: string }) {
  return (
    <SiteShell>
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-10 text-center">
          <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">{message}</h1>
          <Link
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
            href="/evaluadores/recuperar"
          >
            Recuperar acceso a mis proyectos
          </Link>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
