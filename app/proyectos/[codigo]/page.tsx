import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Sparkles } from "lucide-react";

import { CriteriaWeight } from "@/components/criteria-weight";
import { ScoreOrb } from "@/components/score-orb";
import { SectionShell } from "@/components/section-shell";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import { getProjectDetail, getProjectEditHistory, shouldUseMockData } from "@/lib/supabase/queries";
import { createProjectFileSignedUrl } from "@/lib/supabase/storage";
import { AnalyzeProjectButton } from "./analyze-project-button";

export const dynamic = "force-dynamic";

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  await requireAdmin();

  const { codigo } = await params;
  const { proyecto, evaluaciones, analisis } = await getProjectDetail(codigo);

  if (!proyecto) {
    notFound();
  }

  const evaluacion = evaluaciones[0] ?? null;
  const estadoAnalisis = analisis?.estado_analisis ?? analisis?.estado;
  const analisisCompleto = estadoAnalisis === "Completado";
  const scoreIA = analisisCompleto ? analisis?.puntaje_sugerido_ia ?? null : null;
  const scoreHumano = evaluacion?.porcentaje ?? evaluacion?.puntaje_total ?? null;
  const fileUrl = proyecto.archivo_storage_path && !shouldUseMockData()
    ? await createProjectFileSignedUrl(proyecto.archivo_storage_path)
    : proyecto.archivo_url ?? "#";
  const posterUrl = proyecto.poster_proyecto_path && !shouldUseMockData()
    ? await createProjectFileSignedUrl(proyecto.poster_proyecto_path)
    : "#";
  const equipo = proyecto.equipo ?? [];
  const autorPrincipal = equipo.filter((member) => member.rol_integrante === "Autor principal");
  const aprendices = equipo.filter((member) => member.rol_integrante === "Aprendiz participante");
  const instructoresInvestigadores = equipo.filter((member) => member.rol_integrante === "Instructor" || member.rol_integrante === "Investigador asociado");
  const minorConsentUrls = Object.fromEntries(
    await Promise.all(
      equipo
        .filter((member) => member.tratamiento_datos_menor_path && !shouldUseMockData())
        .map(async (member) => [
          member.tratamiento_datos_menor_path ?? "",
          await createProjectFileSignedUrl(member.tratamiento_datos_menor_path ?? ""),
        ]),
    ),
  );
  const editHistory = proyecto.id ? await getProjectEditHistory(proyecto.id) : [];

  return (
    <SiteShell>
      <section className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="expo-panel p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill>{proyecto.codigo_proyecto ?? proyecto.codigo}</StatusPill>
            <StatusPill status={proyecto.estado_analisis_ia ?? proyecto.estado} />
          </div>
          <h1 className="mt-5 max-w-4xl font-heading text-4xl font-black leading-tight text-[var(--color-text)] sm:text-5xl">
            {proyecto.nombre_proyecto ?? proyecto.titulo}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-muted)]">
            {displayText(proyecto.resumen_problema ?? proyecto.resumen)}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {proyecto.id ? <AnalyzeProjectButton proyectoId={proyecto.id} /> : null}
            <Link
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/70 px-5 text-sm font-bold text-[var(--color-text)] hover:bg-white"
            >
              <ExternalLink className="size-4" />
              Ver archivo
            </Link>
            {proyecto.poster_proyecto_path ? (
              <Link
                href={posterUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/70 px-5 text-sm font-bold text-[var(--color-text)] hover:bg-white"
              >
                <ExternalLink className="size-4" />
                Ver póster
              </Link>
            ) : null}
          </div>
        </div>
        <Card>
          <CardContent className="grid place-items-center pt-2">
            <ScoreOrb score={scoreIA ?? scoreHumano} status={estadoAnalisis ?? proyecto.estado} size="lg" />
            <p className="mt-4 text-center text-sm leading-6 text-[var(--color-muted)]">
              Puntaje IA prioritario. Si aún no existe, se muestra el puntaje de evaluación humana.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha del proyecto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Info label="Línea temática" value={projectLine(proyecto)} />
            <Info label="Modalidad" value={proyecto.modalidad_participacion} />
            <Info label="Semillero" value={projectSeedbed(proyecto)} />
            <Info label="Categoría" value="Póster" />
            <Info label="Institucion" value={proyecto.institucion} />
            <Info label="Municipio" value={proyecto.municipio} />
            <Info label="Archivo historico del proyecto" value={proyecto.archivo_nombre ?? proyecto.archivo_proyecto_nombre ?? "Sin archivo historico"} />
            <Info label="Póster del proyecto" value={proyecto.poster_proyecto_nombre ?? "Sin póster"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--color-primary)]" />
              Criterios y score
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <CriteriaWeight label="Innovación IA" value={analisis?.nivel_innovacion_ia ?? scoreIA} />
            <CriteriaWeight label="Pertinencia IA" value={analisis?.nivel_pertinencia_ia ?? scoreHumano} />
            <CriteriaWeight label="Impacto IA" value={analisis?.nivel_impacto_ia ?? 0} />
            <CriteriaWeight label="Viabilidad IA" value={analisis?.nivel_viabilidad_ia ?? 0} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resumen científico</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Info label="Problema" value={proyecto.resumen_problema ?? proyecto.resumen} />
            <Info label="Objetivo" value={proyecto.resumen_objetivo} />
            <Info label="Metodología" value={proyecto.resumen_metodologia} />
            <Info label="Resultados" value={proyecto.resumen_resultados} />
            <Info label="Conclusiones" value={proyecto.resumen_conclusiones} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modalidad y estado</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Info label="Línea temática" value={projectLine(proyecto)} />
            <Info label="Modalidades" value={displayList(proyecto.modalidades_proyecto, proyecto.modalidad_participacion)} />
            {proyecto.modalidad_otro ? <Info label="Otra modalidad" value={proyecto.modalidad_otro} /> : null}
            <Info label="Estado del proyecto" value={proyecto.estado_desarrollo_proyecto} />
            <Info label="Productos obtenidos" value={displayList(proyecto.productos_obtenidos)} />
            {proyecto.productos_obtenidos_otro ? <Info label="Otro producto" value={proyecto.productos_obtenidos_otro} /> : null}
            <Info label="Nivel de madurez" value={proyecto.nivel_madurez} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Equipo del proyecto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <TeamGroup title="Autor(es) principal(es)" members={autorPrincipal} minorConsentUrls={minorConsentUrls} />
            <TeamGroup title="Aprendices participantes" members={aprendices} minorConsentUrls={minorConsentUrls} />
            <TeamGroup title="Instructores o investigadores asociados" members={instructoresInvestigadores} minorConsentUrls={minorConsentUrls} emptyText="No registrados" />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Requisitos del stand</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Info label="Punto de electricidad" value={booleanText(proyecto.requiere_conexion_electrica)} />
            <Info label="Mesa o mobiliario especial" value={booleanText(proyecto.requiere_mesa_mobiliario)} />
            <Info label="Prototipo funcional" value={booleanText(proyecto.presenta_prototipo_funcional)} />
            <Info label="Otro elemento requerido" value={booleanText(proyecto.requiere_otro_elemento)} />
            <Info label="Descripcion del otro elemento" value={proyecto.otro_elemento_descripcion ?? ""} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Comparacion evaluador vs IA</CardTitle>
          </CardHeader>
          <CardContent>
            {evaluacion && analisisCompleto && analisis ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ComparisonBlock label="Evaluador" score={scoreHumano} concept={evaluacion.concepto_evaluador} />
                  <ComparisonBlock label="IA" score={scoreIA} concept={analisis.concepto_ia} />
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white/52 p-4">
                  <p className="expo-eyebrow">Diferencia</p>
                  <p className="mt-2 font-sans text-3xl font-extrabold text-[var(--color-text)]">
                    {Math.abs((scoreHumano ?? 0) - (scoreIA ?? 0))} pts
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                La comparación aparecerá cuando existan una evaluación humana y un análisis IA completados.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-[var(--color-success)]" />
              Archivos y trazabilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Info label="Documento histórico" value={proyecto.archivo_nombre ?? proyecto.archivo_proyecto_nombre ?? "Sin archivo histórico"} />
            <Info label="Póster" value={proyecto.poster_proyecto_nombre ?? "Sin póster"} />
          </CardContent>
        </Card>
      </section>

      <SectionShell className="mt-8" eyebrow="Análisis IA" title="Lectura técnica y tendencias">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumen y concepto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6 text-[var(--color-muted)]">
              {analisisCompleto && analisis ? (
                <>
                  <Info label="Resumen IA" value={displayText(analisis.resumen_ia)} />
                  <Info label="Nivel de tendencia" value={displayText(analisis.nivel_tendencia_ia)} />
                  <Info label="Concepto IA" value={displayText(analisis.concepto_ia)} />
                  <ChipList label="Tendencias identificadas" values={analisis.tendencias_identificadas} />
                  <ChipList label="Recomendaciones" values={[...(analisis.oportunidades_detectadas ?? []), ...(analisis.palabras_clave_ia ?? [])]} />
                </>
              ) : (
                <p>Aún no existe un análisis IA completo para este proyecto.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inclusión, género y enfoque diferencial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analisisCompleto && analisis ? (
                <>
                  <CriteriaWeight label="Inclusión de género" value={analisis.nivel_inclusion_genero_ia ?? 0} />
                  <CriteriaWeight label="Inclusión étnica" value={analisis.nivel_inclusion_etnica_ia ?? 0} />
                  <Info label="Enfoque de género" value={displayText(analisis.enfoque_genero_ia)} />
                  <Info label="Enfoque étnico" value={displayText(analisis.enfoque_etnico_ia)} />
                  <Info label="Enfoque diferencial" value={displayText(analisis.enfoque_diferencial_ia)} />
                  <ChipList label="Recomendaciones limpias" values={[...(analisis.recomendaciones_genero_ia ?? []), ...(analisis.recomendaciones_etnicas_ia ?? [])]} />
                  <ChipList label="Riesgos de exclusión" values={analisis.riesgos_exclusion_ia ?? []} />
                </>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">Pendiente de análisis IA.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Historial de actualizaciones</CardTitle></CardHeader>
          <CardContent>
            {editHistory.length ? <div className="grid gap-3">{editHistory.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-[var(--color-border)] bg-white/45 p-4 text-sm">
                <p className="font-bold text-[var(--color-text)]">{entry.tipo_edicion}</p>
                <p className="mt-1 text-[var(--color-muted)]">{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(entry.created_at))}</p>
                <p className="mt-1 text-[var(--color-muted)]">Documento solicitante: {entry.documento_solicitante}</p>
                {entry.observacion ? <p className="mt-2 text-[var(--color-muted)]">Observación: {entry.observacion}</p> : null}
              </div>
            ))}</div> : <p className="text-sm text-[var(--color-muted)]">Este proyecto aún no registra actualizaciones.</p>}
          </CardContent>
        </Card>
      </SectionShell>
    </SiteShell>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4">
      <p className="expo-eyebrow">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text)]">{displayText(value)}</p>
    </div>
  );
}

function ComparisonBlock({ label, score, concept }: { label: string; score?: number | null; concept?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white/52 p-4">
      <p className="expo-eyebrow">{label}</p>
      <div className="mt-3 flex items-center gap-4">
        <ScoreOrb score={score} size="sm" />
        <p className="text-sm leading-6 text-[var(--color-muted)]">{displayText(concept)}</p>
      </div>
    </div>
  );
}

function TeamGroup({
  title,
  members,
  minorConsentUrls,
  emptyText = "Sin registros.",
}: {
  title: string;
  members: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>["proyecto"]>["equipo"];
  minorConsentUrls: Record<string, string>;
  emptyText?: string;
}) {
  return (
    <div className="grid gap-3">
      <p className="expo-eyebrow">{title}</p>
      {members && members.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <div key={`${member.rol_integrante}-${member.orden}-${member.nombre_completo}`} className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4">
              <p className="text-sm font-extrabold leading-6 text-[var(--color-text)]">{displayText(member.nombre_completo)}</p>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-muted)]">
                <p>Rol: {member.rol_integrante}</p>
                {member.documento ? <p>Documento: {member.documento}</p> : null}
                {member.correo ? <p>Correo: {member.correo}</p> : null}
                {member.celular ? <p>Celular: {member.celular}</p> : null}
                {member.ficha ? <p>Ficha: {member.ficha}</p> : null}
                <p>Menor de edad: {member.es_menor_edad ? "Sí" : "No"}</p>
                {member.tratamiento_datos_menor_path ? (
                  <Link
                    href={minorConsentUrls[member.tratamiento_datos_menor_path] ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)]"
                  >
                    <ExternalLink className="size-4" />
                    Ver autorización
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">{emptyText}</p>
      )}
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

function booleanText(value?: boolean) {
  return value ? "Si" : "No";
}

function ChipList({ label, values }: { label: string; values?: unknown }) {
  const safeValues = Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  return (
    <div>
      <p className="expo-eyebrow">{label}</p>
      {safeValues.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {safeValues.map((value) => (
            <StatusPill key={value} tone="neutral">{value}</StatusPill>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-muted)]">Pendiente</p>
      )}
    </div>
  );
}
