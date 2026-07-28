import { EvaluadorasManager } from "@/app/admin/productores/evaluadoras/evaluadoras-manager";
import { SiteShell } from "@/components/site-shell";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function EvaluadoresProductoresAdminPage() {
  await requireAdmin();
  return (
    <SiteShell>
      <p className="expo-eyebrow">Administración</p>
      <h1 className="expo-page-title mt-2">Evaluadores de productores campesinos</h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Desde este módulo puede registrar y administrar los evaluadores autorizados para revisar las iniciativas productivas campesinas.
      </p>
      <EvaluadorasManager />
    </SiteShell>
  );
}
