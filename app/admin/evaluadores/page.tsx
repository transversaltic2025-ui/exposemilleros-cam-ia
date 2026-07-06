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
import { getEvaluators } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminEvaluadoresPage() {
  const evaluadores = await getEvaluators();

  return (
    <SiteShell>
      <div className="mb-8">
        <p className="expo-eyebrow">Admin</p>
        <h1 className="expo-page-title mt-2">Evaluadores</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Vista interna de carga y disponibilidad. Los datos sensibles se mantienen fuera de tablas publicas.
        </p>
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
                <TableHead>Area</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Asignados</TableHead>
                <TableHead>Estado</TableHead>
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
