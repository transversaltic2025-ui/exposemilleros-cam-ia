import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyzeProductorButton } from "./analyze-button";

export const dynamic = "force-dynamic";
const list = (value: unknown) => Array.isArray(value) ? value.join(", ") : String(value || "—");
export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  await requireAdmin();
  const { codigo } = await params;
  const client = createSupabaseServerClient();
  const { data: initiative } = await client.from("productores_iniciativas").select("*").eq("codigo_iniciativa", codigo).maybeSingle();
  if (!initiative) notFound();
  const [{ data: evaluations }, { data: analysis }] = await Promise.all([
    client.from("evaluaciones_productores").select("*, evaluadoras_productores(nombre_completo)").eq("iniciativa_id", initiative.id),
    client.from("analisis_ia_productores").select("*").eq("iniciativa_id", initiative.id).maybeSingle(),
  ]);
  return <SiteShell><p className="expo-eyebrow">{initiative.codigo_iniciativa}</p><div className="flex flex-wrap justify-between gap-4"><h1 className="expo-page-title mt-2">{initiative.nombre_iniciativa}</h1><AnalyzeProductorButton iniciativaId={initiative.id}/></div><div className="mt-8 grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Datos del productor</CardTitle></CardHeader><CardContent className="space-y-2"><p><b>Nombre:</b> {initiative.nombre_productor}</p><p><b>Documento:</b> {initiative.documento}</p><p><b>Celular:</b> {initiative.celular}</p><p><b>Ubicación:</b> {initiative.municipio}, {initiative.vereda?.trim() || "No registrada"}</p></CardContent></Card><Card><CardHeader><CardTitle>Iniciativa productiva</CardTitle></CardHeader><CardContent className="space-y-2"><p><b>Línea productiva:</b> {initiative.linea_productiva}</p><p><b>Año de inicio:</b> {initiative.anio_inicio}</p><p><b>Nivel de madurez:</b> {initiative.nivel_madurez}</p><p><b>Producto o servicio:</b> {initiative.producto_servicio}</p><p><b>Descripción:</b> {initiative.descripcion_iniciativa}</p><p><b>Productos obtenidos:</b> {list(initiative.productos_obtenidos)}</p><p><b>Dónde vende actualmente:</b> {list(initiative.donde_vende)}</p><p><b>Principal dificultad:</b> {list(initiative.principal_dificultad)}</p></CardContent></Card><Card><CardHeader><CardTitle>Evaluaciones humanas</CardTitle></CardHeader><CardContent className="space-y-4">{evaluations?.map(e => <div key={e.id} className="rounded-xl border p-4"><p className="font-bold">{e.evaluadoras_productores?.nombre_completo} · {e.porcentaje}%</p><p>{e.nivel_tendencia}</p><p className="mt-2 text-sm">{e.concepto_evaluadora}</p></div>)}{!evaluations?.length && <p>Sin evaluaciones todavía.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Análisis IA de productores</CardTitle></CardHeader><CardContent>{analysis ? <div className="space-y-2"><p>{analysis.resumen_ia}</p><p><b>Potencial:</b> {analysis.potencial_comercial_ia}</p><p><b>Prioridad:</b> {analysis.prioridad_acompanamiento}</p><p><b>Puntaje:</b> {analysis.porcentaje_ia}% · {analysis.nivel_tendencia_ia}</p><p><b>Recomendaciones:</b> {list(analysis.recomendaciones_ia)}</p></div> : <p>El análisis IA aún no ha sido generado.</p>}</CardContent></Card></div></SiteShell>;
}
