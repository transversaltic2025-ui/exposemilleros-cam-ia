import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function JovenesEmprendedoresGraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  return (
    <SiteShell>
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto size-14 text-[var(--color-success)]" />
          <h1 className="expo-page-title mt-5">Registro realizado correctamente</h1>
          <p className="mt-4 text-[var(--color-muted)]">Su inscripción como joven emprendedor fue registrada correctamente.</p>
          <p className="mt-6 text-lg font-black">Código de registro: {codigo || "JOV-XXXX"}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="rounded-xl bg-[var(--color-primary)] px-5 py-3 font-bold text-white" href="/jovenes-emprendedores/inscripcion">Registrar otro joven emprendedor</Link>
            <Link className="rounded-xl border border-[var(--color-primary)] px-5 py-3 font-bold text-[var(--color-primary)]" href="/">Volver al inicio</Link>
          </div>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
