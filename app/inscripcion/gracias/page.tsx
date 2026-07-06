import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function GraciasInscripcionPage() {
  return (
    <SiteShell>
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-[var(--color-success)]" />
          <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">Proyecto recibido</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            El registro fue recibido. El archivo queda disponible para evaluacion mediante enlaces seguros por token.
          </p>
          <Link className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]" href="/proyectos">
            Ver proyectos publicos
          </Link>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
