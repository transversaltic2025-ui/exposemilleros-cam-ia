import { signedStatusFilter } from "@/lib/certificates/signed-status";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listSignedCertificates } from "@/lib/certificates/signed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/site-shell";
import { SignedManager } from "./signed-manager";
import type { AssociationError, SignedCertificate } from "@/types/signed-certificate";
import { inspectSignedCertificateBucket, inspectSignedCertificateColumns, signedCertificateError } from "@/lib/certificates/signed-schema";

export const dynamic = "force-dynamic";
export default async function SignedCertificatesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireAdmin();
  const { estado } = await searchParams;
  let certificates: SignedCertificate[] = [];
  let errors: AssociationError[] = [];
  let errorCount = 0;
  let uploadsDisabled = false;
  const warnings: string[] = [];
  const checks = await Promise.allSettled([
    inspectSignedCertificateColumns(),
    inspectSignedCertificateBucket(),
    (async () => {
      const result = await createSupabaseServerClient().from("certificados_firma_errores").select("id,archivo:archivo_nombre,documento:documento_detectado,motivo", { count: "exact" }).in("estado", ["No asociado", "Error"]).order("created_at", { ascending: false }).limit(200);
      if (result.error) throw result.error;
      return result;
    })(),
  ]);
  const [schema, bucket, associationErrors] = checks;
  const missingColumns = schema.status === "fulfilled" ? schema.value : [];
  for (const column of missingColumns) warnings.push(`Falta la columna certificados.${column}. Ejecute la migración de certificados firmados.`);
  if (schema.status === "rejected") warnings.push(signedCertificateError(schema.reason));
  if (bucket.status === "rejected") warnings.push(signedCertificateError(bucket.reason, "No fue posible verificar el bucket certificates."));
  uploadsDisabled = missingColumns.length > 0 || schema.status === "rejected" || bucket.status === "rejected";
  if (associationErrors.status === "fulfilled") {
    errors = associationErrors.value.data as AssociationError[];
    errorCount = associationErrors.value.count ?? 0;
  } else {
    warnings.push(`${signedCertificateError(associationErrors.reason, "No se pudo cargar el historial de errores de asociación.")} El historial no está disponible; puede consultar los certificados.`);
  }
  try {
    certificates = await listSignedCertificates(undefined, missingColumns, warnings);
  } catch (error) {
    console.error("[firmados/admin] No se pudo consultar el módulo", error);
    warnings.push(signedCertificateError(error));
    uploadsDisabled = true;
  }
  return <SiteShell>
      <Link href="/admin/certificados" className="text-sm underline">Volver a certificados</Link>
      <h1 className="expo-page-title mt-4">Certificados firmados</h1>
      <p className="my-4 text-[var(--color-muted)]">Suba los certificados PDF firmados para que los participantes puedan descargarlos desde la plataforma.</p>
      {warnings.length > 0 && <div role="alert" className="my-5 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">{[...new Set(warnings)].map(message => <p key={message}>{message}</p>)}{uploadsDisabled && <p>Las cargas están deshabilitadas hasta corregir la configuración. Los registros disponibles se muestran abajo.</p>}</div>}
      <SignedManager key={signedStatusFilter(estado)} certificates={certificates} errors={errors} errorCount={errorCount} uploadsDisabled={uploadsDisabled} initialStatus={signedStatusFilter(estado)} />
    </SiteShell>;
}
