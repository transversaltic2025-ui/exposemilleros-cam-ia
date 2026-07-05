import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function GraciasInscripcionPage() {
  return (
    <SiteShell>
      <Card className="mx-auto max-w-2xl rounded-lg">
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 size-10 text-emerald-700" />
          <h1 className="text-2xl font-semibold">Proyecto recibido</h1>
          <p className="mt-3 text-slate-700">
            Este es un flujo mock. En produccion se guardara el registro en Google Sheets y el archivo en Google Drive.
          </p>
          <Link className="mt-6 inline-flex text-sm font-medium text-teal-800 hover:underline" href="/proyectos">
            Ver proyectos publicos
          </Link>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
