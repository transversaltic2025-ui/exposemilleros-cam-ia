import Link from "next/link";
import { FileBadge } from "lucide-react";

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
import {
  getCertificates,
  getHumanEvaluations,
  getProjects,
} from "@/lib/supabase/queries";
import { requireAdmin } from "@/lib/admin-auth";
import { createCertificateSignedUrl } from "@/lib/supabase/storage";
import { GenerateCertificateButton } from "./generate-certificate-button";

export const dynamic = "force-dynamic";

export default async function AdminCertificadosPage() {
  await requireAdmin();

  const [certificados, proyectos, evaluaciones] = await Promise.all([
    getCertificates(),
    getProjects(),
    getHumanEvaluations(),
  ]);

  const ponentes = proyectos.reduce((total, proyecto) => total + proyecto.integrantes.length, 0);
  const instructores = new Set(
    proyectos.flatMap((proyecto) => [
      proyecto.instructor_nombre,
      proyecto.instructor_2_nombre,
      proyecto.instructor_3_nombre,
    ]).filter(Boolean),
  ).size;
  const evaluadoresConEvaluacion = new Set(
    evaluaciones.map((evaluacion) => evaluacion.evaluador_id).filter(Boolean),
  ).size;
  const generados = certificados.filter(
    (certificado) => (certificado.estado_certificado ?? certificado.estado) === "Generado",
  ).length;
  const candidatos = ponentes + instructores + evaluadoresConEvaluacion;
  const pendientes = Math.max(candidatos - generados, 0);

  const certificadosConUrl = await Promise.all(
    certificados.map(async (certificado) => {
      const pathOrUrl = certificado.url_certificado ?? certificado.archivo_certificado_url;
      if (!pathOrUrl) {
        return { ...certificado, signedUrl: null };
      }

      try {
        return {
          ...certificado,
          signedUrl: await createCertificateSignedUrl(pathOrUrl),
        };
      } catch {
        return { ...certificado, signedUrl: pathOrUrl };
      }
    }),
  );

  return (
    <SiteShell>
      <div className="mb-8">
        <p className="expo-eyebrow">Admin</p>
        <h1 className="expo-page-title mt-2">Certificados</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
          Generacion de certificados PDF en Supabase Storage para ponentes, instructores lideres y evaluadores.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Ponentes" value={ponentes} detail="Aprendices en póster" accent="secondary" />
        <MetricCard label="Instructores lideres" value={instructores} detail="Responsables unicos" accent="mint" />
        <MetricCard label="Evaluadores" value={evaluadoresConEvaluacion} detail="Con evaluación" accent="success" />
        <MetricCard label="Generados" value={generados} detail="PDF creados" />
        <MetricCard label="Pendientes" value={pendientes} detail="Estimados" accent="secondary" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBadge className="size-5 text-[var(--color-primary)]" />
            Generacion
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <GenerateCertificateButton
            tipoCertificado="Ponente"
            label="Generar certificados de ponentes"
          />
          <GenerateCertificateButton
            tipoCertificado="Instructor"
            label="Generar certificados de instructores"
          />
          <GenerateCertificateButton
            tipoCertificado="Evaluador"
            label="Generar certificados de evaluadores"
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Certificado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificadosConUrl.map((certificado) => (
                <TableRow key={certificado.id ?? certificado.certificado_id}>
                  <TableCell className="font-medium">
                    {certificado.nombre_persona ?? certificado.nombre}
                  </TableCell>
                  <TableCell>{certificado.tipo_certificado ?? certificado.tipo}</TableCell>
                  <TableCell>{certificado.rol_certificado ?? certificado.rol}</TableCell>
                  <TableCell className="whitespace-normal">
                    {certificado.proyecto_nombre ??
                      certificado.proyecto_codigo ??
                      certificado.codigo_proyecto ??
                      "Evento"}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={certificado.estado_certificado ?? certificado.estado ?? "Pendiente"} />
                  </TableCell>
                  <TableCell>
                    {certificado.signedUrl ? (
                      <Link
                        href={certificado.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-xl border border-[var(--color-border)] bg-white/65 px-3 text-sm font-bold text-[var(--color-primary)] hover:bg-white"
                      >
                        Ver certificado
                      </Link>
                    ) : (
                      <span className="text-sm text-[var(--color-muted)]">Sin PDF</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {certificadosConUrl.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-muted)]">Aún no hay certificados generados.</p>
          ) : null}
        </CardContent>
      </Card>
    </SiteShell>
  );
}
