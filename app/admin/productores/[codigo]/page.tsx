import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyzeProductorButton } from "./analyze-button";

export const dynamic = "force-dynamic";
const list = (value: unknown) => Array.isArray(value) && value.length ? value.join(", ") : String(value || "No registrado");
const visible = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : "No registrado";

export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  await requireAdmin();
  const { codigo } = await params;
  const client = createSupabaseServerClient();
  const { data: initiative } = await client.from("productores_iniciativas").select("*").eq("codigo_iniciativa", codigo).maybeSingle();
  if (!initiative) notFound();
  const [{ data: evaluations }, { data: analysis }] = await Promise.all([
    client.from("evaluaciones_productores").select("*, evaluadoras_productores(nombre_completo:nombre)").eq("iniciativa_id", initiative.id),
    client.from("analisis_ia_productores").select("*").eq("iniciativa_id", initiative.id).maybeSingle(),
  ]);
  const humanAvailable = Boolean(evaluations?.length);
  const humanPercentage = humanAvailable ? Math.round((evaluations || []).reduce((sum, evaluation) => sum + Number(evaluation.porcentaje || 0), 0) / evaluations!.length * 100) / 100 : null;
  const humanLevel = humanPercentage === null ? null : humanPercentage >= 80 ? "Alto potencial" : humanPercentage >= 60 ? "Potencial medio" : "Requiere fortalecimiento";
  const aiAvailable = Boolean(analysis && analysis.estado_analisis !== "Error" && typeof analysis.porcentaje_ia === "number");

  return <SiteShell>
    <p className="expo-eyebrow">{initiative.codigo_iniciativa}</p>
    <div className="flex flex-wrap justify-between gap-4"><h1 className="expo-page-title mt-2">{initiative.nombre_iniciativa}</h1><AnalyzeProductorButton iniciativaId={initiative.id}/></div>

    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Datos del productor</CardTitle></CardHeader><CardContent className="space-y-2"><p><b>Nombre:</b> {initiative.nombre_productor}</p><p><b>Documento:</b> {initiative.documento}</p><p><b>Celular:</b> {initiative.celular}</p><p><b>Ubicación:</b> {initiative.municipio}, {initiative.vereda?.trim() || "No registrada"}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Iniciativa productiva</CardTitle></CardHeader><CardContent className="space-y-2"><p><b>Línea productiva:</b> {initiative.linea_productiva}</p><p><b>Año de inicio:</b> {initiative.anio_inicio}</p><p><b>Nivel de madurez:</b> {initiative.nivel_madurez}</p><p><b>Producto o servicio:</b> {initiative.producto_servicio}</p><p><b>Descripción:</b> {initiative.descripcion_iniciativa}</p><p><b>Productos obtenidos:</b> {list(initiative.productos_obtenidos)}</p><p><b>Dónde vende actualmente:</b> {list(initiative.donde_vende)}</p><p><b>Principal dificultad:</b> {list(initiative.principal_dificultad)}</p></CardContent></Card>

      <Card className="lg:col-span-2"><CardHeader><CardTitle>Resumen de resultados</CardTitle></CardHeader><CardContent><p className="mb-5 text-sm leading-6 text-[var(--color-muted)]">La evaluación humana es el criterio oficial de las evaluadoras. El análisis IA funciona como apoyo complementario para la toma de decisiones.</p>{!humanAvailable && !aiAvailable ? <p>Aún no hay resultados registrados para esta iniciativa.</p> : <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border p-4"><p className="font-bold">Evaluación humana</p>{humanAvailable ? <><p className="mt-2"><b>Promedio:</b> {humanPercentage}%</p><p><b>Nivel de tendencia:</b> {humanLevel}</p></> : <p className="mt-2 text-[var(--color-muted)]">Evaluación humana pendiente.</p>}</div><div className="rounded-xl border p-4"><p className="font-bold">Análisis IA</p>{aiAvailable ? <><p className="mt-2"><b>Porcentaje IA:</b> {analysis.porcentaje_ia}%</p><p><b>Nivel de tendencia IA:</b> {analysis.nivel_tendencia_ia}</p></> : <p className="mt-2 text-[var(--color-muted)]">Análisis IA pendiente.</p>}</div></div>}</CardContent></Card>

      <Card><CardHeader><CardTitle>Evaluación humana de evaluadoras</CardTitle><p className="text-sm leading-6 text-[var(--color-muted)]">Resultado registrado por las evaluadoras autorizadas. Esta evaluación corresponde al criterio humano del equipo evaluador.</p></CardHeader><CardContent className="space-y-4">{evaluations?.map(evaluation => <div key={evaluation.id} className="space-y-2 rounded-xl border p-4"><p className="font-bold">Evaluación de {evaluation.evaluadoras_productores?.nombre_completo || "evaluadora autorizada"}</p><p><b>Porcentaje:</b> {evaluation.porcentaje ?? 0}%</p><p><b>Nivel de tendencia:</b> {visible(evaluation.nivel_tendencia)}</p><p><b>Concepto de la evaluadora:</b> {visible(evaluation.concepto_evaluadora)}</p><p><b>Fortalezas:</b> {visible(evaluation.fortalezas)}</p><p><b>Aspectos por mejorar:</b> {visible(evaluation.aspectos_mejora)}</p><p><b>Apoyo recomendado:</b> {visible(evaluation.apoyo_recomendado)}</p></div>)}{!humanAvailable && <p>Sin evaluaciones todavía.</p>}</CardContent></Card>

      <Card><CardHeader><CardTitle>Análisis IA complementario</CardTitle><p className="text-sm leading-6 text-[var(--color-muted)]">Análisis generado automáticamente como apoyo para identificar tendencias, oportunidades, riesgos y necesidades de fortalecimiento. No reemplaza la evaluación humana.</p></CardHeader><CardContent>{aiAvailable ? <div className="space-y-2"><p>{analysis.resumen_ia}</p><p><b>Potencial:</b> {analysis.potencial_comercial_ia}</p><p><b>Prioridad:</b> {analysis.prioridad_acompanamiento}</p><p><b>Porcentaje:</b> {analysis.porcentaje_ia}% · {analysis.nivel_tendencia_ia}</p><p><b>Riesgos:</b> {list(analysis.riesgos_detectados)}</p><p><b>Oportunidades:</b> {list(analysis.oportunidades_detectadas)}</p><p><b>Necesidades de fortalecimiento:</b> {list(analysis.necesidades_fortalecimiento)}</p><p><b>Recomendaciones:</b> {list(analysis.recomendaciones_ia)}</p></div> : <p>El análisis IA aún no ha sido generado.</p>}</CardContent></Card>
    </div>
  </SiteShell>;
}
