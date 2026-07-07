import Link from "next/link";
import { ClipboardCheck, FileText, ShieldCheck, Users } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const publicActions = [
  {
    href: "/inscripcion",
    title: "Inscripcion de proyectos",
    detail: "Registro institucional de proyectos en modalidad poster.",
    icon: FileText,
    label: "Inscribir proyecto",
  },
  {
    href: "/evaluadores/registro",
    title: "Registro de evaluadores",
    detail: "Vinculacion de evaluadores por area de conocimiento.",
    icon: Users,
    label: "Registrar evaluador",
  },
];

export default function Home() {
  return (
    <SiteShell>
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-6">
          <p className="expo-eyebrow">ExpoInnovacion y CampeSENA</p>
          <div className="space-y-4">
            <h1 className="expo-page-title max-w-4xl">ExpoSemilleros CAM IA</h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--color-muted)]">
              Sistema web para el Encuentro de Semilleros de Investigacion CAM 2026. Desde aqui puede registrar
              proyectos y vincular evaluadores al proceso del evento.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/inscripcion"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(109,63,169,0.22)] hover:bg-[var(--color-secondary)]"
            >
              <FileText className="size-4" />
              Inscribir proyecto
            </Link>
            <Link
              href="/evaluadores/registro"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/70 px-5 text-sm font-bold text-[var(--color-text)] hover:bg-white"
            >
              <Users className="size-4" />
              Registrar evaluador
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[var(--color-primary)]" />
              Proceso del evento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
            <p>Los proyectos se registran desde el formulario oficial de ExpoSemilleros IA.</p>
            <p>Los evaluadores reciben enlaces seguros por token para realizar sus evaluaciones.</p>
            <p>La informacion registrada sera revisada por el equipo organizador del evento.</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        {publicActions.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-5 text-[var(--color-primary)]" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-5 text-sm leading-6 text-[var(--color-muted)]">
                <p>{item.detail}</p>
                <Link
                  href={item.href}
                  className="mt-auto inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
                >
                  {item.label}
                  <ClipboardCheck className="size-4" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </SiteShell>
  );
}
