import Link from "next/link";
import { Download, FileBadge, FileUp } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { SiteShell } from "@/components/site-shell";
import { StatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
import { listCertificateTemplates } from "@/lib/certificates/templates";
import { getProducerEvaluatorCertificateCount } from "@/lib/certificates/generate";

export const dynamic = "force-dynamic";
const PACKAGE_SIZE = 30;

function packageLinks(tipo: string, label: string, count: number) {
  return Array.from({ length: Math.ceil(count / PACKAGE_SIZE) }, (_, index) => {
    const offset = index * PACKAGE_SIZE;
    const end = Math.min(offset + PACKAGE_SIZE, count);
    return {
      href: `/api/admin/certificados/package?tipo=${tipo}&offset=${offset}&limit=${PACKAGE_SIZE}`,
      label: `${label} paquete ${index + 1}: ${offset + 1} al ${end}`,
    };
  });
}

export default async function AdminCertificadosPage() {
  await requireAdmin();

  const [certificados, proyectos, evaluaciones, templateResult, evaluadoresProductores] = await Promise.all([
    getCertificates(),
    getProjects(),
    getHumanEvaluations(),
    listCertificateTemplates(),
    getProducerEvaluatorCertificateCount(),
  ]);
  const activeTemplate = templateResult.templates.find(template => template.activo) ?? null;
  const activeTemplateUrl = activeTemplate
    ? await createCertificateSignedUrl(activeTemplate.archivo_path).catch(() => null)
    : null;

  const ponentes = proyectos.reduce((total, proyecto) => total + proyecto.integrantes.length, 0);
  const lideres = new Set(
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
  const candidatos = ponentes + lideres + evaluadoresConEvaluacion + evaluadoresProductores;
  const pendientes = Math.max(candidatos - generados, 0);
  const downloadable = certificados.filter(certificado =>
    Boolean(certificado.url_certificado ?? certificado.archivo_certificado_url),
  );
  const certificateKind = (certificate: (typeof downloadable)[number]) =>
    String(certificate.tipo_certificado ?? certificate.tipo ?? "").toLowerCase();
  const isProducerEvaluator = (item: (typeof downloadable)[number]) => {
    const kind = certificateKind(item);
    return kind.includes("evaluador productores") || kind.includes("evaluador de productores");
  };
  const packageGroups = [
    { tipo: "ponente", label: "Ponentes", count: downloadable.filter(item => certificateKind(item).includes("ponente")).length },
    { tipo: "lider", label: "Líderes de proyecto", count: downloadable.filter(item => certificateKind(item).includes("líder de proyecto") || certificateKind(item).includes("instructor")).length },
    { tipo: "evaluador", label: "Evaluadores", count: downloadable.filter(item => certificateKind(item).includes("evaluador") && !isProducerEvaluator(item)).length },
    { tipo: "evaluador-productores", label: "Evaluadores de productores campesinos", count: downloadable.filter(isProducerEvaluator).length },
    { tipo: "productor", label: "Productores campesinos", count: downloadable.filter(item => certificateKind(item).includes("productor") && !isProducerEvaluator(item)).length },
    { tipo: "joven", label: "Jóvenes emprendedores", count: downloadable.filter(item => certificateKind(item).includes("joven")).length },
  ].filter(group => group.count > 0);
  const downloads = [
    ...packageGroups.flatMap(group => packageLinks(group.tipo, group.label, group.count)),
    ...packageLinks("todos", "Todos los certificados", downloadable.length),
  ];

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

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Ponentes" value={ponentes} detail="Aprendices en póster" accent="secondary" />
        <MetricCard label="Líderes de proyecto" value={lideres} detail="Responsables únicos" accent="mint" />
        <MetricCard label="Evaluadores" value={evaluadoresConEvaluacion} detail="Con evaluación" accent="success" />
        <MetricCard label="Evaluadores productores" value={evaluadoresProductores} detail="Con evaluación registrada" accent="mint" />
        <MetricCard label="Generados" value={generados} detail="PDF creados" />
        <MetricCard label="Pendientes" value={pendientes} detail="Estimados" accent="secondary" />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileUp className="size-5 text-[var(--color-primary)]" />Plantilla oficial de certificados</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted)]">Suba y configure el PDF base que se utilizará para generar los certificados del evento.</p>
          {templateResult.tableMissing ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">No existe la tabla certificados_plantillas. Ejecute el SQL de configuración antes de subir la plantilla.</p> : null}
          {activeTemplate ? <div className="mt-5 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white/45 p-4 text-sm md:grid-cols-4"><p><b>Nombre:</b><br />{activeTemplate.nombre}</p><p><b>Tipo:</b><br />{activeTemplate.tipo_certificado}</p><p><b>Fecha de carga:</b><br />{activeTemplate.created_at ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(activeTemplate.created_at)) : "Sin fecha"}</p><p><b>Estado:</b><br />Activa</p></div> : <p className="mt-4 text-sm font-bold">No hay una plantilla activa.</p>}
          <div className="mt-5 flex flex-wrap gap-3"><Link href="/admin/certificados/plantilla" className={buttonVariants()}>Subir o gestionar plantilla PDF</Link>{activeTemplateUrl ? <Link href={activeTemplateUrl} target="_blank" className={buttonVariants({ variant: "outline" })}>Ver plantilla activa</Link> : null}{activeTemplate ? <Link href={`/api/admin/certificates/templates/preview?tipo=${encodeURIComponent(activeTemplate.tipo_certificado)}`} target="_blank" className={buttonVariants({ variant: "outline" })}>Generar vista previa</Link> : null}</div>
        </CardContent>
      </Card>

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
            tipoCertificado="Líder de proyecto"
            label="Generar certificados de líderes de proyecto"
          />
          <GenerateCertificateButton
            tipoCertificado="Evaluador"
            label="Generar certificados de evaluadores"
          />
          <GenerateCertificateButton tipoCertificado="Evaluador productores campesinos" label="Generar certificados de evaluadores de productores campesinos" />
          <GenerateCertificateButton tipoCertificado="Ponente" label="Regenerar certificados de ponentes" overwrite />
          <GenerateCertificateButton tipoCertificado="Líder de proyecto" label="Regenerar certificados de líderes de proyecto" overwrite />
          <GenerateCertificateButton tipoCertificado="Evaluador" label="Regenerar certificados de evaluadores" overwrite />
          <GenerateCertificateButton tipoCertificado="Evaluador productores campesinos" label="Regenerar certificados de evaluadores de productores campesinos" overwrite />
          <div className="md:col-span-3">
            <GenerateCertificateButton tipoCertificado="Todos" label="Regenerar todos los certificados" overwrite />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="size-5 text-[var(--color-primary)]" />Descarga de paquetes</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted)]">Descargue los certificados generados en archivos ZIP organizados por tipo de participación.</p>
          {downloads.length ? <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{downloads.map(link => <Link key={link.href} href={link.href} className={buttonVariants({ variant: "outline" })}><Download className="size-4" />{link.label}</Link>)}</div> : <p className="mt-4 text-sm font-bold">Primero genere los certificados antes de descargar el paquete.</p>}
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
                  <TableCell>{certificado.rol_certificado ?? certificado.tipo_certificado ?? certificado.tipo}</TableCell>
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
