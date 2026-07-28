import Image from "next/image";
import Link from "next/link";
import { CalendarDays, FilePenLine, FilePlus2, FileText, KeyRound, MapPin, NotebookPen, Rocket, ShieldCheck, Sprout, UserRoundPlus, Users } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isEvaluatorRegistrationEnabled, isProducersRegistrationEnabled, isProjectEditingEnabled, isProjectRegistrationEnabled, isYoungEntrepreneursRegistrationEnabled } from "@/lib/system-config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [registrationEnabled, editingEnabled, evaluatorRegistrationEnabled, producersRegistrationEnabled, youngEntrepreneursRegistrationEnabled] = await Promise.all([
    isProjectRegistrationEnabled(),
    isProjectEditingEnabled(),
    isEvaluatorRegistrationEnabled(),
    isProducersRegistrationEnabled(),
    isYoungEntrepreneursRegistrationEnabled(),
  ]);
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
              href="/proyectos-investigacion"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(109,63,169,0.22)] hover:bg-[var(--color-secondary)]"
            >
              <FileText className="size-4" />
              Proyectos de investigación
            </Link>
            <Link
              href="/evaluadores/registro"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/70 px-5 text-sm font-bold text-[var(--color-text)] hover:bg-white"
            >
              <Users className="size-4" />
              Acceso evaluadores de proyectos
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

      <section className="mt-12 grid items-stretch gap-6 lg:grid-cols-2">
        <HomeModuleCard
          icon={NotebookPen}
          title="Proyectos de investigación"
          description="Inscribe un proyecto de investigación o ingrese para editar una inscripción existente."
          actions={[
            {
              href: "/inscripcion",
              label: "Inscribir proyecto",
              icon: FilePlus2,
              enabled: registrationEnabled,
              closedMessage: "La inscripción de proyectos está cerrada en este momento.",
            },
            {
              href: "/inscripcion/editar",
              label: "Editar inscripción",
              icon: FilePenLine,
              enabled: editingEnabled,
              closedMessage: "La edición de inscripciones está cerrada en este momento.",
            },
          ]}
        />
        <HomeModuleCard
          icon={Sprout}
          title="Productores campesinos"
          description="Registre iniciativas productivas campesinas o ingrese como evaluador autorizado."
          actions={[
            {
              href: "/productores/inscripcion",
              label: "Inscribir iniciativa",
              icon: Sprout,
              enabled: producersRegistrationEnabled,
              closedMessage: "La inscripción de productores campesinos está cerrada en este momento.",
            },
            { href: "/evaluadores-productores", label: "Acceso evaluadores", icon: Users, enabled: true },
          ]}
        />
        <HomeModuleCard
          icon={Users}
          title="Evaluadores de proyectos"
          description="Acceda al registro, recuperación y evaluación de proyectos de investigación en modalidad póster."
          actions={[
            {
              href: "/evaluadores/registro",
              label: "Registro de evaluadores de proyectos (modalidad póster)",
              icon: UserRoundPlus,
              enabled: evaluatorRegistrationEnabled,
              closedMessage: "El registro público de evaluadores de proyectos de investigación en modalidad póster está cerrado en este momento.",
            },
            { href: "/evaluadores/recuperar", label: "Recuperar acceso", icon: KeyRound, enabled: true },
          ]}
        />
        <HomeModuleCard
          icon={Rocket}
          title="Jóvenes emprendedores"
          description="Inscripción para jóvenes emprendedores del departamento del Meta."
          actions={[
            {
              href: "/jovenes-emprendedores/inscripcion",
              label: "Inscribir joven emprendedor",
              icon: Rocket,
              enabled: youngEntrepreneursRegistrationEnabled,
              closedMessage: "La inscripción de jóvenes emprendedores está cerrada en este momento.",
            },
          ]}
        />
      </section>
    </SiteShell>
  );
}

type ModuleAction = {
  href: string;
  label: string;
  icon: typeof FileText;
  enabled: boolean;
  closedMessage?: string;
};

function HomeModuleCard({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  actions: ModuleAction[];
}) {
  return (
    <Card className="flex h-full flex-col rounded-3xl bg-white/85 shadow-[0_18px_45px_rgba(30,41,59,0.10)]">
      <CardHeader className="gap-4 p-6 pb-3 sm:p-8 sm:pb-4">
        <div className="grid size-12 place-items-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_12px_28px_rgba(109,63,169,0.22)]">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl font-black">{title}</CardTitle>
        <p className="text-sm leading-7 text-[var(--color-muted)] sm:text-base">{description}</p>
      </CardHeader>
      <CardContent className="mt-auto grid gap-3 p-6 pt-3 sm:p-8 sm:pt-4">
        {actions.map((action, index) => (
          <div key={action.href} className="grid gap-2">
            {!action.enabled && action.closedMessage ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
                {action.closedMessage}
              </p>
            ) : null}
            <HomeModuleButton action={action} primary={index === 0} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HomeModuleButton({ action, primary }: { action: ModuleAction; primary: boolean }) {
  const Icon = action.icon;
  const className = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition ${
    action.enabled
      ? primary
        ? "bg-[var(--color-primary)] text-white shadow-[0_12px_24px_rgba(109,63,169,0.18)] hover:bg-[var(--color-secondary)]"
        : "border border-[var(--color-primary)] bg-white text-[var(--color-primary)] hover:bg-violet-50"
      : "cursor-not-allowed border border-[var(--color-border)] bg-slate-100 text-[var(--color-muted)] opacity-65"
  }`;

  if (!action.enabled) {
    return <span aria-disabled="true" className={className}>{action.label}<Icon className="size-4" /></span>;
  }
  return <Link href={action.href} className={className}>{action.label}<Icon className="size-4" /></Link>;
}
