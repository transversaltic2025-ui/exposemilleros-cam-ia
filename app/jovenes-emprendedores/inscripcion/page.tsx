import Link from "next/link";
import { Rocket } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isYoungEntrepreneursRegistrationEnabled } from "@/lib/system-config";
import { JovenEmprendedorForm } from "./joven-emprendedor-form";

export const dynamic = "force-dynamic";

export default async function JovenesEmprendedoresInscripcionPage() {
  const enabled = await isYoungEntrepreneursRegistrationEnabled();
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-full bg-[var(--color-primary)] text-white"><Rocket className="size-6" /></div>
          <div>
            <p className="expo-eyebrow">Jóvenes emprendedores</p>
            <h1 className="expo-page-title mt-1">{enabled ? "Inscripción de jóvenes emprendedores" : "Inscripción de jóvenes emprendedores cerrada"}</h1>
          </div>
        </div>
        {enabled ? (
          <>
            <p className="mt-4 max-w-3xl text-[var(--color-muted)]">Complete la información requerida para registrar su participación como joven emprendedor.</p>
            <Card className="mt-8 bg-white/80"><CardHeader><CardTitle>Formulario de inscripción</CardTitle></CardHeader><CardContent><JovenEmprendedorForm /></CardContent></Card>
          </>
        ) : (
          <Card className="mt-8"><CardContent className="grid gap-4 py-8">
            <p className="text-sm leading-6 text-[var(--color-muted)]">La inscripción pública de jóvenes emprendedores se encuentra cerrada.</p>
            <Link href="/" className="inline-flex h-11 w-fit items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white">Volver al inicio</Link>
          </CardContent></Card>
        )}
      </section>
    </SiteShell>
  );
}
