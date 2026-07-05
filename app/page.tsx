import Link from "next/link";
import { ArrowRight, Bot, ClipboardCheck, FileText, Users } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resumenLogisticaMock } from "@/lib/mock-data";

export default function Home() {
  return (
    <SiteShell>
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
        <div className="space-y-6">
          <div className="inline-flex rounded-md bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
            ExpoInnovacion y CampeSENA
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              ExpoSemilleros CAM IA
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              Sistema web para inscripcion, asignacion, evaluacion por token,
              analisis IA, tendencias y certificados del Encuentro de Semilleros
              de Investigacion CAM 2026.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/inscripcion"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <FileText className="size-4" />
              Inscribir proyecto
            </Link>
            <Link
              href="/evaluadores/registro"
              className="inline-flex h-10 items-center gap-2 rounded-md border bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              <Users className="size-4" />
              Registrar evaluador
            </Link>
          </div>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Flujo operativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Inscripcion", "Proyecto y archivo desde /inscripcion"],
              ["Asignacion", "Maximo 3 proyectos por evaluador y 2 evaluadores por proyecto"],
              ["Evaluacion", "Formulario humano por token sin login"],
              ["Analisis IA", "Resumen, tendencias, puntaje sugerido y concepto"],
            ].map(([title, detail]) => (
              <div key={title} className="flex gap-3">
                <ArrowRight className="mt-1 size-4 text-teal-700" />
                <div>
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-slate-600">{detail}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-4">
        <StatCard label="Proyectos" value={resumenLogisticaMock.proyectos} detail="Mock registrados" />
        <StatCard label="Evaluadores" value={resumenLogisticaMock.evaluadores} detail="Disponibles por area" />
        <StatCard label="Asignaciones" value={resumenLogisticaMock.asignaciones} detail="Balanceadas por reglas" />
        <StatCard label="Certificados" value={resumenLogisticaMock.certificadosPendientes} detail="Pendientes por preparar" />
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-teal-700" />
              Evaluacion humana
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-700">
            Puntajes, observaciones, fortalezas, oportunidades, recomendacion final y concepto del evaluador.
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5 text-blue-700" />
              Analisis IA
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-700">
            Lectura del archivo, tendencias identificadas, puntaje sugerido, nivel de tendencia y concepto IA.
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Privacidad publica</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-700">
            Las tablas publicas no muestran correos, documentos ni celulares. Esos datos quedan para operacion interna.
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
