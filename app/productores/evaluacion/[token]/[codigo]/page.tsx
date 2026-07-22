import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readEvaluadoraToken } from "@/lib/productores-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EvaluacionProductorForm } from "./form";

export const dynamic = "force-dynamic";
export default async function Page({params}:{params:Promise<{token:string;codigo:string}>}) {
  const {token,codigo}=await params;const auth=readEvaluadoraToken(token);if(!auth)notFound();const client=createSupabaseServerClient();
  const[{data:initiative},{data:evaluator}]=await Promise.all([client.from("productores_iniciativas").select("*").eq("codigo_iniciativa",codigo).maybeSingle(),client.from("evaluadoras_productores").select("activo").eq("id",auth.id).maybeSingle()]);
  if(!initiative||!evaluator?.activo)notFound();
  const{data:existing}=await client.from("evaluaciones_productores").select("*").eq("iniciativa_id",initiative.id).eq("evaluadora_id",auth.id).maybeSingle();
  return <SiteShell><p className="expo-eyebrow">{initiative.codigo_iniciativa}</p><h1 className="expo-page-title mt-2">{initiative.nombre_iniciativa}</h1><div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><Card><CardHeader><CardTitle>Iniciativa productiva</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><b>Productor:</b> {initiative.nombre_productor}</p><p><b>Ubicación:</b> {initiative.municipio}, {initiative.vereda?.trim()||"No registrada"}</p><p><b>Línea:</b> {initiative.linea_productiva}</p><p><b>Madurez:</b> {initiative.nivel_madurez}</p><p><b>Producto:</b> {initiative.producto_servicio}</p><p><b>Descripción:</b> {initiative.descripcion_iniciativa}</p></CardContent></Card><Card><CardHeader><CardTitle>Evaluación humana</CardTitle></CardHeader><CardContent>{existing?<div><p className="font-bold">Esta iniciativa ya fue evaluada por usted.</p><p className="mt-3">Puntaje: {existing.puntaje_total}/25 · {existing.porcentaje}%</p><p>{existing.nivel_tendencia}</p><p className="mt-3 text-sm">{existing.concepto_evaluadora}</p></div>:<EvaluacionProductorForm token={token} codigoIniciativa={initiative.codigo_iniciativa}/>}</CardContent></Card></div></SiteShell>;
}
