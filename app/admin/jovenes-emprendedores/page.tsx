import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JovenEmprendedor } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminJovenesEmprendedoresPage() {
  await requireAdmin();
  const { data, error } = await createSupabaseServerClient()
    .from("jovenes_emprendedores")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const records = (data ?? []) as JovenEmprendedor[];

  return (
    <SiteShell>
      <p className="expo-eyebrow">Administración</p>
      <h1 className="expo-page-title mt-2">Jóvenes emprendedores</h1>
      <p className="mt-3 text-[var(--color-muted)]">Consulte los registros de jóvenes emprendedores.</p>
      <Card className="mt-8">
        <CardHeader><CardTitle>Registros ({records.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Código</TableHead><TableHead>Nombre completo</TableHead><TableHead>Documento</TableHead>
              <TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead>Edad</TableHead>
              <TableHead>Municipio</TableHead><TableHead>Grupo Sisbén</TableHead><TableHead>Estrato</TableHead>
              <TableHead>Tipo</TableHead><TableHead>Tiempo de experiencia</TableHead><TableHead>Fecha de registro</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {records.map((record) => <TableRow key={record.id}>
                <TableCell className="font-bold">{record.codigo_registro}</TableCell>
                <TableCell>{record.nombre_completo}</TableCell><TableCell>{record.documento}</TableCell>
                <TableCell>{record.telefono}</TableCell><TableCell>{record.correo}</TableCell><TableCell>{record.edad}</TableCell>
                <TableCell>{record.municipio_residencia}</TableCell><TableCell>{record.grupo_sisben}</TableCell>
                <TableCell>{record.estrato}</TableCell><TableCell>{record.tipo_joven_emprendedor}</TableCell>
                <TableCell>{record.tiempo_experiencia_emprendimiento}</TableCell>
                <TableCell>{formatDate(record.created_at)}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
          {!records.length ? <p className="py-8 text-center text-sm text-[var(--color-muted)]">Aún no hay registros.</p> : null}
        </CardContent>
      </Card>
    </SiteShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(value));
}
