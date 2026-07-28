import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { getAssignments, getEvaluators, getProjects } from "@/lib/supabase/queries";
import { ManualAssignmentManager } from "../manual-assignment-manager";

export const dynamic = "force-dynamic";

export default async function ManualAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ proyecto?: string }>;
}) {
  await requireAdmin();
  const [{ proyecto }, projects, evaluators, assignments] = await Promise.all([
    searchParams,
    getProjects(),
    getEvaluators(),
    getAssignments(),
  ]);

  return (
    <SiteShell>
      <Link href="/admin/asignaciones" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
        <ArrowLeft className="size-4" />
        Volver a asignaciones
      </Link>
      <div className="mb-8 mt-5">
        <p className="expo-eyebrow">Administración · Proyectos de investigación</p>
        <h1 className="expo-page-title mt-2">Asignación manual</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
          Asigne evaluadores de proyectos de investigación. Este módulo es independiente del módulo de productores campesinos.
        </p>
      </div>
      <ManualAssignmentManager
        projects={projects}
        evaluators={evaluators}
        assignments={assignments}
        initialProjectCode={proyecto}
      />
    </SiteShell>
  );
}
