import Link from "next/link";

export function ProductoresAccessShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen text-[var(--color-text)]">
    <header className="border-b border-[var(--color-border)] bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[var(--color-primary)] font-heading text-xl font-black text-white">E</span>
          <div><p className="font-heading text-xl font-black">ExpoSemilleros IA</p><p className="text-xs text-[var(--color-muted)]">Gestión de productores campesinos</p></div>
        </div>
        <Link href="/" className="text-sm font-bold text-[var(--color-primary)]">Volver al inicio</Link>
      </div>
    </header>
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">{children}</main>
  </div>;
}
