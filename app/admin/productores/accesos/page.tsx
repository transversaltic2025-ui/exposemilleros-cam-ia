import { SiteShell } from "@/components/site-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { AccesosProductoresManager } from "./accesos-manager";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdmin();
  return <SiteShell>
    <p className="expo-eyebrow">Administración · Productores campesinos</p>
    <h1 className="expo-page-title mt-2">Accesos a productores campesinos</h1>
    <p className="mt-3 max-w-3xl text-[var(--color-muted)]">Desde este módulo puede crear accesos restringidos para personas autorizadas a consultar iniciativas campesinas.</p>
    <AccesosProductoresManager />
  </SiteShell>;
}
