import { Download } from "lucide-react";
import { EvaluadorasManager } from "@/app/admin/productores/evaluadoras/evaluadoras-manager";
import { SiteShell } from "@/components/site-shell";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function EvaluadoresProductoresAdminPage() {
  await requireAdmin();
  return (
    <SiteShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="expo-eyebrow">Administración</p>
          <h1 className="expo-page-title mt-2">Evaluadores de productores campesinos</h1>
          <p className="mt-3 text-[var(--color-muted)]">
            Desde este módulo puede registrar y administrar los evaluadores autorizados para revisar las iniciativas productivas campesinas.
          </p>
        </div>
        <a href="/api/admin/productores/evaluadores/export/excel" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white">
          <Download className="size-4" />Descargar evaluadores
        </a>
      </div>
      <EvaluadorasManager />
    </SiteShell>
  );
}
