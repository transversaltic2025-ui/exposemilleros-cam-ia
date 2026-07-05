import Link from "next/link";
import { BarChart3, ClipboardCheck, FileText, Home, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/inscripcion", label: "Inscripcion", icon: FileText },
  { href: "/proyectos", label: "Proyectos", icon: ClipboardCheck },
  { href: "/tendencias", label: "Tendencias", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="flex flex-col">
            <span className="text-lg font-semibold">ExpoSemilleros IA</span>
            <span className="text-sm text-slate-600">
              Encuentro de Semilleros de Investigacion CAM 2026
            </span>
          </Link>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
