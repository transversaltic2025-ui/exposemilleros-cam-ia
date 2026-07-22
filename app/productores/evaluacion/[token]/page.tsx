import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";
import { readEvaluadoraToken } from "@/lib/productores-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function Page({params}:{params:Promise<{token:string}>}) {
  const { token } = await params; const auth = readEvaluadoraToken(token); if (!auth) notFound();
  const client = createSupabaseServerClient();
  const [{data:evaluator},{data:items},{data:done}] = await Promise.all([
    client.from("evaluadoras_productores").select("nombre,activo").eq("id",auth.id).maybeSingle(),
    client.from("productores_iniciativas").select("*").order("created_at",{ascending:false}),
    client.from("evaluaciones_productores").select("iniciativa_id").eq("evaluadora_id",auth.id),
  ]);
  if (!evaluator?.activo) notFound(); const evaluated = new Set(done?.map(value=>value.iniciativa_id));
  return <SiteShell><p className="expo-eyebrow">Panel de evaluación</p><h1 className="expo-page-title mt-2">Bienvenida, {evaluator.nombre}</h1><p className="mt-2 text-[var(--color-muted)]">Puede consultar y evaluar todas las iniciativas productivas campesinas.</p><div className="mt-8 grid gap-4">{items?.map(item=><Card key={item.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 py-5"><div><p className="font-bold">{item.nombre_iniciativa}</p><p className="text-sm text-[var(--color-muted)]">{item.codigo_iniciativa} · {item.linea_productiva} · {item.municipio}, {item.vereda?.trim()||"No registrada"}</p></div><Link className="rounded-xl bg-[var(--color-primary)] px-4 py-2 font-bold text-white" href={`/productores/evaluacion/${token}/${item.codigo_iniciativa}`}>{evaluated.has(item.id)?"Ver evaluación":"Evaluar"}</Link></CardContent></Card>)}</div></SiteShell>;
}
