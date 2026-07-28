import Link from "next/link";
import { FilePenLine, FilePlus2, NotebookPen } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isProjectEditingEnabled, isProjectRegistrationEnabled } from "@/lib/system-config";

export const dynamic = "force-dynamic";

export default async function ProyectosInvestigacionPage() {
  const [registrationEnabled, editingEnabled] = await Promise.all([
    isProjectRegistrationEnabled(),
    isProjectEditingEnabled(),
  ]);

  return (
    <SiteShell>
      <section className="mx-auto flex max-w-xl justify-center py-4 sm:py-8">
        <Card className="w-full rounded-3xl bg-white/85 shadow-[0_18px_45px_rgba(30,41,59,0.10)]">
          <CardHeader className="gap-4 p-6 pb-3 sm:p-8 sm:pb-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-[var(--color-primary)] text-white shadow-[0_12px_28px_rgba(109,63,169,0.22)]">
              <NotebookPen className="size-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-black sm:text-3xl">
              Proyectos de investigación
            </CardTitle>
            <p className="text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              Inscribe un proyecto de investigación o ingrese para editar una inscripción existente.
            </p>
          </CardHeader>

          <CardContent className="grid gap-3 p-6 pt-3 sm:p-8 sm:pt-4">
            {!registrationEnabled ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
                La inscripción de proyectos está cerrada en este momento.
              </p>
            ) : null}
            <ModuleButton
              href="/inscripcion"
              enabled={registrationEnabled}
              label="Inscribir proyecto"
              icon={FilePlus2}
              primary
            />

            {!editingEnabled ? (
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
                La edición de inscripciones está cerrada en este momento.
              </p>
            ) : null}
            <ModuleButton
              href="/inscripcion/editar"
              enabled={editingEnabled}
              label="Editar inscripción"
              icon={FilePenLine}
            />
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}

function ModuleButton({
  href,
  enabled,
  label,
  icon: Icon,
  primary = false,
}: {
  href: string;
  enabled: boolean;
  label: string;
  icon: typeof FilePlus2;
  primary?: boolean;
}) {
  const style = enabled
    ? primary
      ? "bg-[var(--color-primary)] text-white shadow-[0_12px_24px_rgba(109,63,169,0.18)] hover:bg-[var(--color-secondary)]"
      : "border border-[var(--color-primary)] bg-white text-[var(--color-primary)] hover:bg-violet-50"
    : "cursor-not-allowed border border-[var(--color-border)] bg-slate-100 text-[var(--color-muted)] opacity-65";

  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold ${style}`}
      >
        {label}
        <Icon className="size-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition ${style}`}
    >
      {label}
      <Icon className="size-4" aria-hidden="true" />
    </Link>
  );
}
