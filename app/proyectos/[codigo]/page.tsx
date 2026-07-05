import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analisisIAMock, evaluacionesMock, getProyectoByCodigo } from "@/lib/mock-data";

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const proyecto = getProyectoByCodigo(codigo);

  if (!proyecto) {
    notFound();
  }

  const evaluacion = evaluacionesMock.find((item) => item.codigo_proyecto === proyecto.codigo);
  const analisis = analisisIAMock.find((item) => item.codigo_proyecto === proyecto.codigo);

  return (
    <SiteShell>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div>
            <Badge variant="secondary">{proyecto.codigo}</Badge>
            <h1 className="mt-3 text-3xl font-semibold">{proyecto.titulo}</h1>
            <p className="mt-3 text-slate-700">{proyecto.resumen}</p>
          </div>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Ficha publica</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Area" value={proyecto.area_conocimiento} />
              <Info label="Modalidad" value={proyecto.modalidad_participacion} />
              <Info label="Semillero" value={proyecto.semillero} />
              <Info label="Categoria" value={proyecto.categoria_presentacion} />
              <Info label="Institucion" value={proyecto.institucion} />
              <Info label="Municipio" value={proyecto.municipio} />
              <Info label="Instructor" value={proyecto.instructor_nombre} />
              <Info label="Estado" value={proyecto.estado} />
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Integrantes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {proyecto.integrantes.map((integrante) => (
                <Badge key={integrante} variant="outline">{integrante}</Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Archivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{proyecto.archivo_nombre}</p>
              <p className="mt-2 text-sm text-slate-600">
                El enlace real se servira desde Google Drive con permisos controlados.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Comparacion evaluador vs IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {evaluacion && analisis ? (
                <>
                  <Info label="Puntaje humano" value={`${evaluacion.puntaje_total}/100`} />
                  <Info
                    label="Puntaje IA"
                    value={
                      analisis.puntaje_sugerido_ia === null
                        ? "Pendiente"
                        : `${analisis.puntaje_sugerido_ia}/100`
                    }
                  />
                  <Info label="Concepto evaluador" value={evaluacion.concepto_evaluador} />
                  <Info label="Concepto IA" value={analisis.concepto_ia} />
                </>
              ) : (
                <p className="text-slate-600">
                  La comparacion aparecera cuando existan evaluacion humana y analisis IA completado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-medium text-slate-950">{label}</div>
      <div className="text-slate-700">{value}</div>
    </div>
  );
}
