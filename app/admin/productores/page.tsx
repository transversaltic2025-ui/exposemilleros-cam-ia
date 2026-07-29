import Link from "next/link";
import { ArrowUpRight, Download, KeyRound, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdmin();
  const { data } = await createSupabaseServerClient()
    .from("productores_iniciativas")
    .select("*, evaluaciones_productores(count)")
    .order("created_at", { ascending: false });
  return <SiteShell>
    <div className="flex flex-wrap justify-between gap-4">
      <div><p className="expo-eyebrow">Administración</p><h1 className="expo-page-title mt-2">Productores campesinos</h1><p className="mt-2 text-[var(--color-muted)]">Iniciativas productivas, evaluaciones y análisis IA.</p></div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/productores/accesos" className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-4 font-bold text-[var(--color-primary)]"><KeyRound className="size-4" />Accesos productores</Link>
        <a href="/api/productores/export/excel" className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-4 font-bold text-[var(--color-primary)]"><Download className="size-4" />Descargar Excel</a>
        <a href="/api/productores/export/pdf" className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-4 font-bold text-[var(--color-primary)]"><Download className="size-4" />Descargar PDF</a>
        <Link href="/admin/productores/evaluadores" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 font-bold text-white"><Users className="size-4" />Evaluadores de productores campesinos</Link>
      </div>
    </div>
    <div className="mt-8 grid gap-4">{(data || []).map(item => <Card key={item.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 py-5"><div><p className="font-bold">{item.nombre_iniciativa}</p><p className="text-sm text-[var(--color-muted)]">{item.codigo_iniciativa} · {item.nombre_productor} · {item.municipio}, {item.vereda?.trim() || "No registrada"}</p><p className="mt-1 text-xs text-[var(--color-muted)]">{item.linea_productiva} · {item.nivel_madurez} · IA: {item.estado_analisis_ia || "Pendiente"} · Evaluaciones: {item.evaluaciones_productores?.[0]?.count || 0}</p></div><Link href={`/admin/productores/${item.codigo_iniciativa}`} className="inline-flex items-center gap-2 font-bold text-[var(--color-primary)]">Ver detalle<ArrowUpRight className="size-4" /></Link></CardContent></Card>)}</div>
    {!data?.length && <p className="mt-8 text-[var(--color-muted)]">Aún no hay iniciativas registradas.</p>}
  </SiteShell>;
}
