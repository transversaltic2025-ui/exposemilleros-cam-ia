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
import { getEvaluators, getProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminEvaluadoresPage() {
  await requireAdmin();

  const [evaluadores, proyectos] = await Promise.all([getEvaluators(), getProjects()]);
  const electricidad = proyectos.filter((project) => project.requiere_conexion_electrica).length;
  const mobiliario = proyectos.filter((project) => project.requiere_mesa_mobiliario).length;
  const prototipos = proyectos.filter((project) => project.presenta_prototipo_funcional).length;
  const otros = proyectos.filter((project) => project.requiere_otro_elemento).length;

  return (
    <SiteShell>
      <div className="mb-8">
        <p className="expo-eyebrow">Admin</p>
        <h1 className="expo-page-title mt-2">Evaluadores</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Vista interna de carga y disponibilidad. Los datos sensibles se mantienen fuera de tablas publicas.
        </p>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="Electricidad" value={electricidad} detail="Proyectos" accent="secondary" />
        <MetricCard label="Mobiliario" value={mobiliario} detail="Proyectos" accent="mint" />
        <MetricCard label="Prototipos" value={prototipos} detail="Funcionales" accent="success" />
        <MetricCard label="Otro elemento" value={otros} detail="Requerido" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Carga por evaluador</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Asignados</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asignaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluadores.map((evaluador) => (
                <TableRow key={evaluador.id ?? evaluador.evaluador_id}>
                  <TableCell>{evaluador.codigo_evaluador ?? evaluador.evaluador_id}</TableCell>
                  <TableCell>{evaluador.nombre_evaluador ?? evaluador.nombre}</TableCell>
                  <TableCell>{evaluador.institucion_evaluador ?? evaluador.entidad}</TableCell>
                  <TableCell>{evaluador.area_conocimiento}</TableCell>
                  <TableCell>{formatDate(evaluador.created_at ?? evaluador.fecha_registro)}</TableCell>
                  <TableCell>
                    {evaluador.cantidad_proyectos_asignados ?? evaluador.proyectos_asignados ?? 0}/3
                  </TableCell>
                  <TableCell>
                    <StatusPill status={evaluador.estado_evaluador ?? evaluador.estado ?? "Activo"} />
                  </TableCell>
                  <TableCell>
                    {evaluador.token_acceso ? (
                      <Link className="inline-flex h-9 items-center rounded-xl bg-white/70 px-3 text-xs font-bold text-[var(--color-primary)] hover:bg-white" href={`/evaluadores/mis-asignaciones/${evaluador.token_acceso}`}>
                        Ver asignaciones
                      </Link>
                    ) : (
                      <span className="text-sm text-[var(--color-muted)]">Sin enlace</span>
                    )}
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

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}
