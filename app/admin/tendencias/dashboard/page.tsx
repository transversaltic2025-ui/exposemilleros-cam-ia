import Link from "next/link";
import { Download, Settings2 } from "lucide-react";
import { TendenciasDashboard } from "@/components/admin/tendencias/tendencias-dashboard";
import { SiteShell } from "@/components/site-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin-auth";
import { getAIDashboardData } from "@/lib/ai/dashboard";

export const dynamic="force-dynamic";

export default async function DashboardPage(){
 await requireAdmin();
 const data=await getAIDashboardData();
 return <SiteShell><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="expo-eyebrow">Analítica administrativa</p><h1 className="expo-page-title mt-2">Dashboard de tendencias IA</h1><p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--color-muted)]">Resumen visual del análisis de tendencias, pertinencia, impacto, viabilidad y enfoque diferencial de los proyectos registrados.</p></div><div className="flex flex-wrap gap-2"><Link className={buttonVariants({variant:"outline"})} href="/admin/tendencias"><Settings2/>Gestionar análisis</Link><a className={buttonVariants()} href="/api/admin/ai/dashboard/report/pdf"><Download/>Descargar reporte PDF</a></div></div><TendenciasDashboard data={data}/></SiteShell>;
}
