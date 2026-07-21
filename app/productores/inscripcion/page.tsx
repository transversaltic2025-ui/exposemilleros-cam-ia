import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductoresForm } from "./productores-form";

export default function ProductoresInscripcionPage() {
  return <SiteShell><div className="mx-auto max-w-4xl">
    <p className="expo-eyebrow">Productores campesinos</p>
    <h1 className="expo-page-title mt-2">Inscripción de iniciativas productivas campesinas</h1>
    <p className="mt-3 max-w-3xl text-[var(--color-muted)]">Registre la información básica de su iniciativa productiva. Esta información permitirá conocer su estado actual, productos, canales de venta y principales dificultades.</p>
    <Card className="mt-8"><CardHeader><CardTitle>Información de la iniciativa</CardTitle></CardHeader><CardContent><ProductoresForm /></CardContent></Card>
  </div></SiteShell>;
}
