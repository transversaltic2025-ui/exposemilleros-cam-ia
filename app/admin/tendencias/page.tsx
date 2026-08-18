import Link from "next/link";
import { BarChart3, CalendarClock } from "lucide-react";
import { BatchAnalysisControl } from "./batch-analysis-control";
import { MetricCard } from "@/components/metric-card";
import { SiteShell } from "@/components/site-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import { getAIDashboardData } from "@/lib/ai/dashboard";

export const dynamic="force-dynamic";

export default async function AdminTrendsPage(){
 await requireAdmin();
 const {summary}=await getAIDashboardData();
 return <SiteShell><p className="expo-eyebrow">Administración</p><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="expo-page-title mt-2">Análisis masivo de tendencias IA</h1><p className="mt-3 text-sm text-[var(--color-muted)]">Procese los proyectos en lotes de dos, continúe interrupciones y consulte resultados agregados.</p></div><Link className={buttonVariants()} href="/admin/tendencias/dashboard"><BarChart3/>Ver dashboard</Link></div><div className="mt-8 grid gap-4 md:grid-cols-4"><MetricCard label="Proyectos registrados" value={summary.totalProjects} detail="Total"/><MetricCard label="Análisis completados" value={summary.analyzedProjects} detail="Último por proyecto" accent="success"/><MetricCard label="Pendientes" value={summary.pendingProjects} detail="Incluye errores" accent="mint"/><MetricCard label="Con error" value={summary.failedProjects} detail="Reintentables" accent="secondary"/></div><Card className="mt-6"><CardHeader><CardTitle>Control del procesamiento</CardTitle></CardHeader><CardContent><BatchAnalysisControl total={summary.totalProjects} analyzed={summary.analyzedProjects} pending={summary.pendingProjects} failed={summary.failedProjects}/></CardContent></Card><Card className="mt-6"><CardContent className="flex items-center gap-3 py-5 text-sm"><CalendarClock className="size-5 text-[var(--color-primary)]"/><span><b>Última fecha de análisis:</b> {summary.lastBulkAnalysis?new Intl.DateTimeFormat("es-CO",{dateStyle:"long",timeStyle:"short",timeZone:"America/Bogota"}).format(new Date(summary.lastBulkAnalysis)):"Sin análisis registrados"}</span></CardContent></Card></SiteShell>;
}
