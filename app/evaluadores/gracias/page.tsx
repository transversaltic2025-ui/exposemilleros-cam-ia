import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function GraciasEvaluadorPage() {
  return (
    <SiteShell>
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-[var(--color-success)]" />
          <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">Evaluador registrado</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Se crearan enlaces tokenizados para evaluar maximo 3 proyectos del area registrada.
          </p>
          <Link className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]" href="/admin/asignaciones">
            Ver asignaciones
          </Link>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
