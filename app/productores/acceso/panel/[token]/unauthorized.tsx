import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function UnauthorizedAccess() {
  return <Card className="mx-auto max-w-xl"><CardContent className="p-8 text-center">
    <h1 className="font-heading text-3xl font-black">Acceso no autorizado</h1>
    <p className="mt-3 text-[var(--color-muted)]">El enlace no es válido o el acceso se encuentra inactivo.</p>
    <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-5 font-bold text-white">Volver al inicio</Link>
  </CardContent></Card>;
}
