import Link from "next/link";
import { ClipboardList, FileBadge, GitBranch, Users } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resumenLogisticaMock } from "@/lib/mock-data";

const adminLinks = [
  {
    href: "/admin/evaluadores",
    title: "Evaluadores",
    detail: "Disponibilidad, area y carga maxima.",
    icon: Users,
  },
  {
    href: "/admin/asignaciones",
    title: "Asignaciones",
    detail: "Tokens, apertura de archivo y estado.",
    icon: GitBranch,
  },
  {
    href: "/admin/certificados",
    title: "Certificados",
    detail: "Participantes, instructores y evaluadores.",
    icon: FileBadge,
  },
];

export default function AdminPage() {
  return (
    <SiteShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Administracion</h1>
        <p className="mt-2 text-slate-700">
          Panel mock sin login tradicional. La proteccion real se definira sin usuarios con contrasena.
        </p>
      </div>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Sin evaluador"
          value={resumenLogisticaMock.proyectosSinEvaluador}
          detail="Caso de prueba activo"
        />
        <StatCard
          label="Con 1 evaluador"
          value={resumenLogisticaMock.proyectosConUnEvaluador}
          detail="Pendientes de segunda asignacion"
        />
        <StatCard
          label="Con 2 evaluadores"
          value={resumenLogisticaMock.proyectosConDosEvaluadores}
          detail="Capacidad maxima por proyecto"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Proyectos" value={resumenLogisticaMock.proyectos} detail="Inscritos" />
        <StatCard label="Evaluadores" value={resumenLogisticaMock.evaluadores} detail="Registrados" />
        <StatCard label="Asignaciones" value={resumenLogisticaMock.asignaciones} detail="Creadas" />
        <StatCard label="Evaluaciones" value={resumenLogisticaMock.evaluaciones} detail="Recibidas" />
        <StatCard label="Certificados" value={resumenLogisticaMock.certificadosPendientes} detail="Pendientes" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {adminLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full rounded-lg transition hover:bg-slate-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-5 text-teal-700" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">{item.detail}</CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      <Card className="mt-6 rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5 text-blue-700" />
            Reglas de asignacion
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
          <p>Maximo 3 proyectos por evaluador.</p>
          <p>Maximo 2 evaluadores por proyecto.</p>
          <p>Area del proyecto y evaluador deben coincidir.</p>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
