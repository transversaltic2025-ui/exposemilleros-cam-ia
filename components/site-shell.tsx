import Link from "next/link";
import { FileText, Home, ShieldCheck, UserRoundPlus } from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/inscripcion", label: "Inscripción", icon: FileText },
  { href: "/evaluadores/registro", label: "Evaluadores", icon: UserRoundPlus },
  { href: "/admin/login", label: "Admin", icon: ShieldCheck },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-[var(--color-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[rgba(243,240,234,0.78)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[var(--color-primary)] font-heading text-xl font-black text-white shadow-[0_12px_28px_rgba(109,63,169,0.24)]">
              E
            </span>
            <span className="flex flex-col">
            <span className="font-heading text-xl font-black leading-tight">ExpoSemilleros IA</span>
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              Encuentro de Semilleros de Investigación CAM 2026
            </span>
            </span>
          </Link>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-transparent px-3 text-sm font-bold text-[var(--color-muted)] transition hover:border-[var(--color-border)] hover:bg-white/62 hover:text-[var(--color-primary)]"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {children}
      </main>
    </div>
  );
}
