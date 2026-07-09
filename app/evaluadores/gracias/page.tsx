import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function GraciasEvaluadorPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    count?: string;
    url?: string;
    message?: string;
    assignmentOpen?: string;
  }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const accessUrl = params.url || (token ? `/evaluadores/mis-asignaciones/${token}` : "");
  const assignmentsCount = Number(params.count ?? 0);
  const assignmentOpen = params.assignmentOpen !== "false";
  const message = params.message || "Evaluador registrado.";

  return (
    <SiteShell>
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-[var(--color-success)]" />
          <h1 className="font-heading text-3xl font-black text-[var(--color-text)]">
            {assignmentOpen ? "Evaluador registrado" : "Registro recibido"}
          </h1>
          {assignmentOpen ? (
            <>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                {message}
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">
                Proyectos asignados: {Number.isFinite(assignmentsCount) ? assignmentsCount : 0}
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Su registro como evaluador fue recibido correctamente.
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Los proyectos serán asignados automáticamente el 5 de agosto de 2026 a las 00:00, hora Colombia, de
                acuerdo con el área de conocimiento seleccionada.
              </p>
            </>
          )}
          <Link
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
            href={assignmentOpen && accessUrl ? accessUrl : "/evaluadores/recuperar"}
          >
            {assignmentOpen ? "Ver mis proyectos asignados" : "Recuperar acceso / consultar mis proyectos"}
          </Link>
          {assignmentOpen && accessUrl ? (
            <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-white/60 p-4 text-left">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--color-muted)]">Enlace privado</p>
              <p className="mt-2 break-all text-sm font-semibold text-[var(--color-text)]">{accessUrl}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </SiteShell>
  );
}
