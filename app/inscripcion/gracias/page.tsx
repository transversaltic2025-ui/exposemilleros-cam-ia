import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCodeCard } from "./project-code-card";

export const dynamic = "force-dynamic";

export default async function GraciasInscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  const projectCode = codigo?.trim();

  return (
    <SiteShell>
      <Card className="mx-auto max-w-3xl">
        <CardContent className="py-10 text-center sm:px-10">
          <CheckCircle2 className="mx-auto mb-4 size-14 text-[var(--color-success)]" />
          <h1 className="expo-page-title">Proyecto registrado correctamente</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
            Su proyecto fue registrado correctamente. Conserve el código del proyecto, ya que lo necesitará si requiere editar la inscripción o reemplazar el póster.
          </p>

          {projectCode ? (
            <ProjectCodeCard code={projectCode} />
          ) : (
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <p className="font-bold">Proyecto registrado correctamente.</p>
              <p className="mt-2">Si no guardó el código, comuníquese con el equipo organizador para recuperarlo.</p>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <SuccessLink href="/inscripcion" primary>Registrar otro proyecto</SuccessLink>
            <SuccessLink href="/inscripcion/editar">Editar inscripción</SuccessLink>
            <SuccessLink href="/proyectos-investigacion">Volver al módulo de proyectos</SuccessLink>
            <SuccessLink href="/">Volver al inicio</SuccessLink>
          </div>
        </CardContent>
      </Card>
    </SiteShell>
  );
}

function SuccessLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold ${
        primary
          ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)]"
          : "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-violet-50"
      }`}
    >
      {children}
    </Link>
  );
}
