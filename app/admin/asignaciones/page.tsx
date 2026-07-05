import Link from "next/link";

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
import { asignacionesMock } from "@/lib/mock-data";

export default function AdminAsignacionesPage() {
  return (
    <SiteShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Asignaciones</h1>
        <p className="mt-2 text-slate-700">
          Control mock de asignaciones por area, tokens y lectura del archivo.
        </p>
      </div>
      <Card className="rounded-lg">
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
                <TableHead>Archivo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asignacionesMock.map((asignacion) => (
                <TableRow key={asignacion.asignacion_id}>
                  <TableCell>{asignacion.asignacion_id}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">{asignacion.codigo_proyecto}</div>
                    <div className="text-slate-600">{asignacion.titulo_proyecto}</div>
                  </TableCell>
                  <TableCell>{asignacion.evaluador_nombre}</TableCell>
                  <TableCell>{asignacion.area_conocimiento}</TableCell>
                  <TableCell>
                    <Link href={`/evaluar/${asignacion.token}`}>
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200">
                        {asignacion.token}
                      </code>
                    </Link>
                  </TableCell>
                  <TableCell>{asignacion.archivo_abierto ? "Abierto" : "Pendiente"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{asignacion.estado}</Badge>
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
