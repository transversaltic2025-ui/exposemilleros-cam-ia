import { FileBadge } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  certificadosMock,
  proyectosMock,
  resumenLogisticaMock,
} from "@/lib/mock-data";

export default function AdminCertificadosPage() {
  const participantes = proyectosMock.reduce((total, proyecto) => total + proyecto.integrantes.length, 0);
  const instructores = new Set(proyectosMock.map((proyecto) => proyecto.instructor_nombre)).size;

  return (
    <SiteShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Certificados</h1>
        <p className="mt-2 text-slate-700">
          Preparacion mock de datos para participantes, instructores y evaluadores.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Participantes" value={participantes} detail="Desde proyectos mock" />
        <StatCard label="Instructores" value={instructores} detail="Responsables unicos" />
        <StatCard label="Evaluadores" value={resumenLogisticaMock.evaluadores} detail="Registrados" />
        <StatCard label="Pendientes" value={resumenLogisticaMock.certificadosPendientes} detail="Por generar" />
      </div>
      <Card className="mt-6 rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBadge className="size-5 text-teal-700" />
            Datos requeridos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          <p>Participantes: nombre, documento interno, proyecto, rol y fecha del evento.</p>
          <p>Instructores: nombre, documento interno, proyecto asociado y centro.</p>
          <p>Evaluadores: nombre, documento interno, entidad, area y evaluaciones completadas.</p>
        </CardContent>
      </Card>
      <Card className="mt-6 rounded-lg">
        <CardHeader>
          <CardTitle>Registros mock</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          {certificadosMock.map((certificado) => (
            <div key={certificado.certificado_id} className="rounded-lg border p-3">
              <div className="font-medium">{certificado.nombre}</div>
              <div className="text-slate-600">{certificado.tipo} - {certificado.estado}</div>
              <div className="text-slate-600">{certificado.codigo_proyecto ?? "Evento"}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </SiteShell>
  );
}
