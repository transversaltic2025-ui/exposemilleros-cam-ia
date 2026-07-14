import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ClipboardCheck, FileText, MapPin, ShieldCheck, Users } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const publicActions = [
  {
    href: "/inscripcion/editar",
    title: "Editar inscripción de un proyecto",
    detail: "Corrija la información o reemplace el póster usando el código del proyecto y el documento de un integrante.",
    icon: ClipboardCheck,
    label: "Editar inscripción de un proyecto",
  },
  {
    href: "/inscripcion",
    title: "Inscripción de proyectos",
    detail: "Registro institucional de proyectos participantes en modalidad póster.",
    icon: FileText,
    label: "Inscribir proyecto",
  },
  {
    href: "/evaluadores/registro",
    title: "Acceso evaluadores",
    detail: "Registro de evaluadores y acceso a recuperación de proyectos asignados.",
    icon: Users,
    label: "Acceso evaluadores",
  },
];

export default function Home() {
  return (
    <SiteShell>
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-6">
          <p className="expo-eyebrow">ExpoInnovación y CampeSENA</p>
          <div className="space-y-4">
            <h1 className="expo-page-title max-w-4xl">IX Encuentro de Semilleros de Investigación CAM 2026</h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--color-muted)]">
              ExpoSemilleros CAM IA acompaña la inscripción, evaluación y gestión institucional del encuentro
              presencial del Centro Agroindustrial del Meta.
            </p>
          </div>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/65 p-4">
              <CalendarDays className="mb-3 size-5 text-[var(--color-primary)]" />
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">Fecha</p>
              <p className="mt-1 text-sm font-extrabold text-[var(--color-text)]">5 de agosto de 2026</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/65 p-4">
              <MapPin className="mb-3 size-5 text-[var(--color-primary)]" />
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">Lugar</p>
              <p className="mt-1 text-sm font-extrabold text-[var(--color-text)]">
                Centro Agroindustrial del Meta, Sede Hachón
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/65 p-4">
              <ShieldCheck className="mb-3 size-5 text-[var(--color-primary)]" />
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">Modalidad</p>
              <p className="mt-1 text-sm font-extrabold text-[var(--color-text)]">Presencial</p>
            </div>
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
              Acceso evaluadores
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white/55 p-3 shadow-[0_18px_45px_rgba(30,41,59,0.12)] ring-1 ring-[var(--color-border)]">
          <Image
            src="/images/post-ix-encuentro-semilleros-cam.jpeg"
            alt="IX Encuentro de Semilleros de Investigación CAM 2026 ExpoInnovación y CampeSENA"
            width={1200}
            height={1600}
            priority
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="h-auto w-full rounded-2xl object-contain"
          />
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
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
