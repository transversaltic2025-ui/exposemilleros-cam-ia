import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isProducersRegistrationEnabled } from "@/lib/system-config";
import { ProductoresForm } from "./productores-form";

export const dynamic = "force-dynamic";

export default async function ProductoresInscripcionPage() {
  const enabled = await isProducersRegistrationEnabled();
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl">
        <p className="expo-eyebrow">Productores campesinos</p>
        <h1 className="expo-page-title mt-2">{enabled ? "Inscripción de iniciativas productivas campesinas" : "Inscripción de productores campesinos cerrada"}</h1>
        {enabled ? (
          <>
            <p className="mt-3 max-w-3xl text-[var(--color-muted)]">Registre la información básica de su iniciativa productiva. Esta información permitirá conocer su estado actual, productos, canales de venta y principales dificultades.</p>
            <Card className="mt-8"><CardHeader><CardTitle>Información de la iniciativa</CardTitle></CardHeader><CardContent><ProductoresForm /></CardContent></Card>
          </>
        ) : (
          <Card className="mt-8"><CardContent className="grid gap-4 py-8">
            <p className="text-sm leading-6 text-[var(--color-muted)]">La inscripción pública de iniciativas de productores campesinos se encuentra cerrada.</p>
            <Link href="/" className="inline-flex h-11 w-fit items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white">Volver al inicio</Link>
          </CardContent></Card>
        )}
      </div>
    </SiteShell>
  );
}
