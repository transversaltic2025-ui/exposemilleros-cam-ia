import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminLoginForm } from "./admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  return (
    <SiteShell>
      <Card className="mx-auto max-w-xl">
        <CardContent className="py-10 text-center">
          <LockKeyhole className="mx-auto mb-4 size-12 text-[var(--color-primary)]" />
          <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">Ingreso administrador</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Accede al panel interno de gestion, evaluacion y analisis.
          </p>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </SiteShell>
  );
}
