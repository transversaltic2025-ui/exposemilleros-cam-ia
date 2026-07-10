import Link from "next/link";
import { ExternalLink, FileText, GraduationCap } from "lucide-react";
import { notFound } from "next/navigation";

import { EvaluationForm } from "@/app/evaluar/[token]/evaluation-form";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import { getEvaluationCriteria, getProjectDetail, shouldUseMockData } from "@/lib/supabase/queries";
import { createProjectFileSignedUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

export default async function CapacitacionProyectoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  await requireAdmin();

  const { codigo } = await params;
  const [detalle, criterios] = await Promise.all([
    getProjectDetail(codigo),
    getEvaluationCriteria(),
  ]);

  if (!detalle.proyecto) {
    notFound();
  }

  const { proyecto } = detalle;
  const posterUrl = proyecto.poster_proyecto_path && !shouldUseMockData()
    ? await createProjectFileSignedUrl(proyecto.poster_proyecto_path)
    : "#";
  const fileUrl = proyecto.archivo_storage_path && !shouldUseMockData()
    ? await createProjectFileSignedUrl(proyecto.archivo_storage_path)
    : proyecto.archivo_url ?? "#";

  return (
    <SiteShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="expo-eyebrow">Admin</p>
          <h1 className="expo-page-title mt-2">Capacitación de evaluadores</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Esta evaluación es solo para práctica y capacitación. No se guardará como evaluación oficial del proyecto.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-800">
          <GraduationCap className="size-4" />
          MODO CAPACITACIÓN
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Proyecto de práctica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6 text-[var(--color-muted)]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{proyecto.codigo_proyecto ?? proyecto.codigo}</StatusPill>
              <StatusPill status={proyecto.estado} />
            </div>
            <div>
              <p className="font-sans text-lg font-extrabold text-[var(--color-text)]">{proyecto.nombre_proyecto ?? proyecto.titulo}</p>
              <p className="mt-2">{proyecto.resumen_problema ?? proyecto.resumen}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Línea temática" value={projectLine(proyecto)} />
              <Info label="Semillero" value={projectSeedbed(proyecto)} />
              <Info label="Modalidades" value={displayList(proyecto.modalidades_proyecto, proyecto.modalidad_participacion)} />
              <Info label="Estado del proyecto" value={proyecto.estado_desarrollo_proyecto} />
              <Info label="Nivel de madurez" value={proyecto.nivel_madurez} />
              <Info label="Productos obtenidos" value={displayList(proyecto.productos_obtenidos)} />
            </div>
            <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white/55 p-4">
              <p className="text-sm font-extrabold text-[var(--color-text)]">Archivos</p>
              <div className="grid gap-2">
                <p className="text-xs text-[var(--color-muted)]">Póster</p>
                {proyecto.poster_proyecto_path ? (
                  <Link href={posterUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)]">
                    <ExternalLink className="size-4" />
                    Abrir póster
                  </Link>
                ) : (
                  <p>Sin póster registrado.</p>
                )}
              </div>
              <div className="grid gap-2">
                <p className="text-xs text-[var(--color-muted)]">Archivo histórico</p>
                {proyecto.archivo_storage_path || proyecto.archivo_url ? (
                  <Link href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)]">
                    <FileText className="size-4" />
                    Abrir archivo
                  </Link>
                ) : (
                  <p>Sin archivo histórico.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formulario de capacitación</CardTitle>
          </CardHeader>
          <CardContent>
            <EvaluationForm criterios={criterios} mode="training" />
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white/55 p-4">
      <p className="expo-eyebrow">{label}</p>
      <p className="mt-2 font-semibold text-[var(--color-text)]">{displayText(value)}</p>
    </div>
  );
}

function displayText(value?: string | null) {
  return value?.trim() || "Pendiente";
}

function displayList(values?: string[], fallback?: string) {
  if (values?.length) {
    return values.join(", ");
  }

  return fallback ?? "";
}

function projectLine(project: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>["proyecto"]>) {
  if (project.linea_tematica === "Otra" && project.linea_tematica_otro) {
    return `Otra: ${project.linea_tematica_otro}`;
  }

  return project.linea_tematica;
}

function projectSeedbed(project: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>["proyecto"]>) {
  if (project.semillero === "Otro" && project.semillero_otro) {
    return `Otro: ${project.semillero_otro}`;
  }

  return project.semillero;
}
