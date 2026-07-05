import { SiteShell } from "@/components/site-shell";
import { StatCard } from "@/components/stat-card";
import { TendenciasChart } from "@/components/tendencias-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  asignacionesPendientesMock,
  resumenLogisticaMock,
  tendenciasPorAreaMock,
} from "@/lib/mock-data";

export default function TendenciasPage() {
  return (
    <SiteShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Dashboard de tendencias</h1>
        <p className="mt-2 text-slate-700">
          Vista mock para analizar areas, tendencias IA y logistica del evento.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Proyectos" value={resumenLogisticaMock.proyectos} detail="Total inscritos mock" />
        <StatCard label="Evaluaciones" value={resumenLogisticaMock.evaluaciones} detail="Humanas recibidas" />
        <StatCard label="Asignaciones" value={resumenLogisticaMock.asignaciones} detail="Por token" />
        <StatCard label="Pendientes" value={asignacionesPendientesMock} detail="Por evaluar" />
      </div>
      <Card className="mt-6 rounded-lg">
        <CardHeader>
          <CardTitle>Proyectos y puntaje por area</CardTitle>
        </CardHeader>
        <CardContent>
          <TendenciasChart data={tendenciasPorAreaMock} />
        </CardContent>
      </Card>
    </SiteShell>
  );
}
