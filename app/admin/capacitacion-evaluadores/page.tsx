import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import { getProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function CapacitacionEvaluadoresPage() {
  await requireAdmin();

  const proyectos = await getProjects();

  return (
    <SiteShell>
      <div className="mb-8 flex flex-col gap-3">
        <p className="expo-eyebrow">Admin</p>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)]">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <h1 className="expo-page-title">Capacitación de evaluadores</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Permite abrir una evaluación de práctica para capacitar a los evaluadores sin registrar resultados oficiales.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proyectos disponibles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {proyectos.length > 0 ? proyectos.map((project) => (
            <div key={project.codigo} className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white/55 p-4 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center">
              <div>
                <p className="font-sans text-sm font-extrabold text-[var(--color-text)]">{project.titulo}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{project.codigo}</p>
              </div>
              <div className="grid gap-1 text-sm text-[var(--color-muted)]">
                <p>Línea: {project.area_conocimiento}</p>
                <p>Semillero: {project.semillero ?? "Sin registro"}</p>
                <p>Estado: {project.estado}</p>
              </div>
              <Link
                href={`/admin/capacitacion-evaluadores/${project.codigo}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
              >
                Abrir evaluación de capacitación
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          )) : (
            <p className="text-sm text-[var(--color-muted)]">Todavía no hay proyectos registrados.</p>
          )}
        </CardContent>
      </Card>
    </SiteShell>
  );
}
