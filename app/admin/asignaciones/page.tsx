import Link from "next/link";

import { MetricCard } from "@/components/metric-card";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin-auth";
import { getActiveEvaluatorsWithoutAssignments, getAssignments, getProjects } from "@/lib/supabase/queries";
import { isAutomaticProjectAssignmentEnabled } from "@/lib/system-config";
import { AutomaticAssignmentControl } from "../automatic-assignment-control";

export const dynamic = "force-dynamic";

export default async function AdminAsignacionesPage() {
  await requireAdmin();

  const [asignaciones, proyectos, automaticAssignmentEnabled, evaluatorsWithoutProject] = await Promise.all([
    getAssignments(),
    getProjects(),
    isAutomaticProjectAssignmentEnabled(),
    getActiveEvaluatorsWithoutAssignments(),
  ]);
  const electricidad = proyectos.filter((project) => project.requiere_conexion_electrica).length;
  const mobiliario = proyectos.filter((project) => project.requiere_mesa_mobiliario).length;
  const prototipos = proyectos.filter((project) => project.presenta_prototipo_funcional).length;
  const otros = proyectos.filter((project) => project.requiere_otro_elemento).length;

  return (
    <SiteShell>
      <div className="mb-8">
        <p className="expo-eyebrow">Admin</p>
        <h1 className="expo-page-title mt-2">Asignaciones</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Control de asignaciones por área, enlaces de acceso y lectura del archivo.
        </p>
        <Link
          href="/admin/asignaciones/manual"
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
        >
          Asignación manual
        </Link>
      </div>
      <AutomaticAssignmentControl
        initialEnabled={automaticAssignmentEnabled}
        initialEvaluatorsWithoutProject={evaluatorsWithoutProject}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="Electricidad" value={electricidad} detail="Proyectos" accent="secondary" />
        <MetricCard label="Mobiliario" value={mobiliario} detail="Proyectos" accent="mint" />
        <MetricCard label="Prototipos" value={prototipos} detail="Funcionales" accent="success" />
        <MetricCard label="Otro elemento" value={otros} detail="Requerido" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asignaciones actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Evaluador</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Edicion</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asignaciones.map((asignacion) => (
                <TableRow key={asignacion.id ?? asignacion.asignacion_id}>
                  <TableCell>{asignacion.id ?? asignacion.asignacion_id}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">
                      {asignacion.proyecto_codigo ?? asignacion.codigo_proyecto ?? asignacion.proyecto_id}
                    </div>
                    <div className="text-[var(--color-muted)]">
                      {asignacion.proyecto_nombre ?? asignacion.titulo_proyecto ?? "Proyecto asignado"}
                    </div>
                  </TableCell>
                  <TableCell>{asignacion.evaluador_nombre ?? asignacion.evaluador_id}</TableCell>
                  <TableCell>{asignacion.proyecto_area ?? asignacion.area_conocimiento ?? "Sin área"}</TableCell>
                  <TableCell>
                    <Link href={`/evaluar/${asignacion.token_evaluacion ?? asignacion.token}`}>
                      <code className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[var(--color-primary)] hover:bg-white">
                        {asignacion.token_evaluacion ?? asignacion.token}
                      </code>
                    </Link>
                  </TableCell>
                  <TableCell>{asignacion.permitir_edicion ? "Permitida" : "Cerrada"}</TableCell>
                  <TableCell>
                    <StatusPill status={asignacion.estado_asignacion ?? asignacion.estado} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
