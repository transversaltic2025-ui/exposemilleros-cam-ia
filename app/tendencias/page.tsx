import { CriteriaWeight } from "@/components/criteria-weight";
import { MetricCard } from "@/components/metric-card";
import { SectionShell } from "@/components/section-shell";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { TendenciasChart } from "@/components/tendencias-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getAIAnalyses,
  getLogisticsSummary,
  getPendingAssignmentsCount,
  getTrendsByArea,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function TendenciasPage() {
  await requireAdmin();

  const [resumenLogistica, asignacionesPendientes, tendenciasPorArea, analisisIA] = await Promise.all([
    getLogisticsSummary(),
    getPendingAssignmentsCount(),
    getTrendsByArea(),
    getAIAnalyses(),
  ]);
  const completedAI = analisisIA.filter((analysis) => analysis.estado_analisis === "Completado" || analysis.estado === "Completado");
  const avgAI =
    completedAI.length === 0
      ? 0
      : Math.round(
          completedAI.reduce((sum, analysis) => sum + (analysis.puntaje_sugerido_ia ?? 0), 0) /
            completedAI.length,
        );
  const avgGenero = averageScore(completedAI.map((analysis) => analysis.nivel_inclusion_genero_ia));
  const avgEtnico = averageScore(completedAI.map((analysis) => analysis.nivel_inclusion_etnica_ia));
  const proyectosConEnfoqueDiferencial = completedAI.filter((analysis) =>
    hasExplicitDifferentialFocus(analysis.enfoque_diferencial_ia),
  ).length;
  const principalesRiesgosExclusion = topItems(
    completedAI.flatMap((analysis) => analysis.riesgos_exclusion_ia ?? []),
  );
  const riesgosFrecuentes = topItems(completedAI.flatMap((analysis) => analysis.riesgos_detectados ?? []));
  const oportunidades = topItems(completedAI.flatMap((analysis) => analysis.oportunidades_detectadas ?? []));

  return (
    <SiteShell>
      <div className="mb-8">
        <p className="expo-eyebrow">Analitica</p>
        <h1 className="expo-page-title mt-2">Dashboard de tendencias</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
          Vista para analizar areas, tendencias IA y logistica del evento.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Proyectos" value={resumenLogistica.proyectos} detail="Total inscritos" />
        <MetricCard label="Evaluaciones" value={resumenLogistica.evaluaciones} detail="Humanas recibidas" accent="success" />
        <MetricCard label="Promedio score" value={`${avgAI}/100`} detail={`${completedAI.length} analisis IA`} accent="secondary" />
        <MetricCard label="Pendientes" value={asignacionesPendientes} detail="Por evaluar" accent="mint" />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Proyectos y puntaje por area</CardTitle>
        </CardHeader>
        <CardContent>
          <TendenciasChart data={tendenciasPorArea} />
        </CardContent>
      </Card>
      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inclusion y enfoque diferencial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CriteriaWeight label="Inclusion de genero" value={avgGenero} />
            <CriteriaWeight label="Inclusion etnica" value={avgEtnico} />
            <MetricCard
              label="Enfoque diferencial"
              value={proyectosConEnfoqueDiferencial}
              detail="Proyectos con evidencia explicita"
              accent="success"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Riesgos frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChipList values={[...principalesRiesgosExclusion, ...riesgosFrecuentes]} empty="Pendiente" />
          </CardContent>
        </Card>
      </section>

      <SectionShell className="mt-8" eyebrow="Lecturas IA" title="Oportunidades detectadas">
        <Card>
          <CardContent className="pt-1">
            <ChipList values={oportunidades} empty="No hay oportunidades registradas todavia." />
          </CardContent>
        </Card>
      </SectionShell>
    </SiteShell>
  );
}

function averageScore(values: Array<number | undefined>) {
  const scores = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (scores.length === 0) {
    return 0;
  }

  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function hasExplicitDifferentialFocus(value?: string) {
  const text = value?.trim().toLowerCase() ?? "";
  return Boolean(text && text !== "pendiente" && !text.startsWith("no se evidencia"));
}

function topItems(values: string[]) {
  const counts = new Map<string, number>();
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([value]) => value);
}

function ChipList({ values, empty }: { values: string[]; empty: string }) {
  const uniqueValues = [...new Set(values)].slice(0, 12);
  if (uniqueValues.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {uniqueValues.map((value) => (
        <StatusPill key={value} tone="neutral">{value}</StatusPill>
      ))}
    </div>
  );
}
