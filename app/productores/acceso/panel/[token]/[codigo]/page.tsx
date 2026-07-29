import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductoresAccessShell } from "@/components/productores-access-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findProductoresAccessByToken } from "@/lib/productores-access";
import { displayList } from "@/lib/productores-export";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UnauthorizedAccess } from "../unauthorized";

export const dynamic = "force-dynamic";
const visible = (value: unknown) => String(value || "No registrado");
const list = (value: unknown) => displayList(value) || "No registrado";

export default async function Page({ params }: { params: Promise<{ token: string; codigo: string }> }) {
  const { token, codigo } = await params;
  const access = await findProductoresAccessByToken(token);
  if (!access) return <ProductoresAccessShell><UnauthorizedAccess /></ProductoresAccessShell>;
  const client = createSupabaseServerClient();
  const { data: initiative } = await client.from("productores_iniciativas").select("*").eq("codigo_iniciativa", codigo).maybeSingle();
  if (!initiative) notFound();
  const [{ data: evaluations }, { data: analysis }] = await Promise.all([
    client.from("evaluaciones_productores").select("*, evaluadoras_productores(nombre)").eq("iniciativa_id", initiative.id),
    client.from("analisis_ia_productores").select("*").eq("iniciativa_id", initiative.id).maybeSingle(),
  ]);
  return <ProductoresAccessShell>
    <Link className="text-sm font-bold text-[var(--color-primary)]" href={`/productores/acceso/panel/${encodeURIComponent(token)}`}>← Volver al panel</Link>
    <p className="expo-eyebrow mt-6">{initiative.codigo_iniciativa}</p><h1 className="expo-page-title mt-2">{initiative.nombre_iniciativa}</h1>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Datos del productor</CardTitle></CardHeader><CardContent className="space-y-2"><p><b>Nombre:</b> {initiative.nombre_productor}</p><p><b>Documento:</b> {initiative.documento}</p><p><b>Celular:</b> {initiative.celular}</p><p><b>Municipio:</b> {initiative.municipio}</p><p><b>Vereda:</b> {initiative.vereda || "No registrada"}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Datos de la iniciativa</CardTitle></CardHeader><CardContent className="space-y-2"><p><b>Año de inicio:</b> {initiative.anio_inicio}</p><p><b>Línea productiva:</b> {initiative.linea_productiva}</p><p><b>Nivel de madurez:</b> {initiative.nivel_madurez}</p><p><b>Producto o servicio:</b> {initiative.producto_servicio}</p><p><b>Descripción:</b> {initiative.descripcion_iniciativa}</p><p><b>Productos obtenidos:</b> {list(initiative.productos_obtenidos)}</p><p><b>Dónde vende actualmente:</b> {list(initiative.donde_vende)}</p><p><b>Principal dificultad:</b> {list(initiative.principal_dificultad)}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Evaluaciones humanas</CardTitle></CardHeader><CardContent className="space-y-4">{evaluations?.map(evaluation => <div className="space-y-2 rounded-xl border p-4" key={evaluation.id}><p className="font-bold">{evaluation.evaluadoras_productores?.nombre || "Evaluador autorizado"}</p><p><b>Porcentaje:</b> {evaluation.porcentaje}%</p><p><b>Nivel de tendencia:</b> {visible(evaluation.nivel_tendencia)}</p><p><b>Concepto:</b> {visible(evaluation.concepto_evaluadora)}</p><p><b>Fortalezas:</b> {visible(evaluation.fortalezas)}</p><p><b>Aspectos por mejorar:</b> {visible(evaluation.aspectos_mejora || evaluation.aspectos_mejorar)}</p><p><b>Apoyo recomendado:</b> {visible(evaluation.apoyo_recomendado)}</p></div>)}{!evaluations?.length && <p className="text-[var(--color-muted)]">No hay evaluación humana registrada.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Análisis IA complementario</CardTitle></CardHeader><CardContent className="space-y-2">{analysis ? <><p>{visible(analysis.resumen_ia)}</p><p><b>Potencial comercial:</b> {visible(analysis.potencial_comercial_ia)}</p><p><b>Prioridad:</b> {visible(analysis.prioridad_acompanamiento)}</p><p><b>Puntaje sugerido:</b> {visible(analysis.puntaje_sugerido_ia)}</p><p><b>Nivel de tendencia:</b> {visible(analysis.nivel_tendencia_ia)}</p><p><b>Riesgos:</b> {list(analysis.riesgos_detectados)}</p><p><b>Oportunidades:</b> {list(analysis.oportunidades_detectadas)}</p><p><b>Necesidades de fortalecimiento:</b> {list(analysis.necesidades_fortalecimiento)}</p><p><b>Recomendaciones:</b> {list(analysis.recomendaciones_ia)}</p></> : <p className="text-[var(--color-muted)]">No hay análisis IA registrado.</p>}</CardContent></Card>
    </div>
  </ProductoresAccessShell>;
}
