import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { evaluadoresMock } from "@/lib/mock-data";

export default function AdminEvaluadoresPage() {
  return (
    <SiteShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Evaluadores</h1>
        <p className="mt-2 text-slate-700">
          Vista interna mock. Los datos sensibles se mantienen fuera de tablas publicas.
        </p>
      </div>
      <Card className="rounded-lg">
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
                <TableHead>Disponibilidad</TableHead>
                <TableHead>Asignados</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluadoresMock.map((evaluador) => (
                <TableRow key={evaluador.evaluador_id}>
                  <TableCell>{evaluador.evaluador_id}</TableCell>
                  <TableCell>{evaluador.nombre}</TableCell>
                  <TableCell>{evaluador.entidad}</TableCell>
                  <TableCell>{evaluador.area_conocimiento}</TableCell>
                  <TableCell>{evaluador.disponibilidad}</TableCell>
                  <TableCell>{evaluador.proyectos_asignados}/3</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{evaluador.estado}</Badge>
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
