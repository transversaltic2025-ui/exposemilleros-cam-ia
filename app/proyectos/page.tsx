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
import { proyectosMock } from "@/lib/mock-data";

export default function ProyectosPage() {
  return (
    <SiteShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Proyectos publicos</h1>
        <p className="mt-2 text-slate-700">
          Listado sin correos, documentos ni celulares. Solo informacion publica del evento.
        </p>
      </div>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Proyectos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Titulo</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Evaluadores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyectosMock.map((proyecto) => (
                <TableRow key={proyecto.codigo}>
                  <TableCell>
                    <Link className="font-medium text-teal-800 hover:underline" href={`/proyectos/${proyecto.codigo}`}>
                      {proyecto.codigo}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-normal">{proyecto.titulo}</TableCell>
                  <TableCell>{proyecto.area_conocimiento}</TableCell>
                  <TableCell>{proyecto.municipio}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{proyecto.estado}</Badge>
                  </TableCell>
                  <TableCell>{proyecto.evaluadores_asignados}/2</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
