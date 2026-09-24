import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listSignedCertificates } from "@/lib/certificates/signed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/site-shell";
import { SignedManager } from "./signed-manager";
import type { AssociationError, SignedCertificate } from "@/types/signed-certificate";

export const dynamic = "force-dynamic";
export default async function SignedCertificatesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireAdmin();
  const { estado } = await searchParams;
  let result: { certificates: SignedCertificate[]; errors: AssociationError[]; count: number } | null = null;
  try {
    const [certificates, errors] = await Promise.all([
      listSignedCertificates(),
      createSupabaseServerClient().from("certificados_firma_errores").select("id,archivo,documento,motivo", { count: "exact" }).eq("resuelto", false).order("created_at", { ascending: false }).limit(200),
    ]);
    if (errors.error) throw errors.error;
    result = { certificates, errors: errors.data as AssociationError[], count: errors.count ?? 0 };
  } catch (error) {
    console.error("[firmados/admin] No se pudo consultar el módulo", error);
  }
  if (!result) return <SiteShell><h1 className="expo-page-title">Certificados firmados</h1><p className="my-6" role="alert">No se pudo cargar el módulo. Verifique la conexión y que se haya ejecutado la migración docs/CERTIFICADOS_FIRMADOS.sql en Supabase.</p><Link href="/admin/certificados">Volver a certificados</Link></SiteShell>;
  return <SiteShell>
      <Link href="/admin/certificados" className="text-sm underline">Volver a certificados</Link>
      <h1 className="expo-page-title mt-4">Certificados firmados</h1>
      <p className="my-4 text-[var(--color-muted)]">Suba los certificados PDF firmados para que los participantes puedan descargarlos desde la plataforma.</p>
      <SignedManager certificates={result.certificates} errors={result.errors} errorCount={result.count} initialStatus={estado === "firmados" ? "Firmado" : estado === "pendientes" ? "Pendiente de firma" : "Todos"} />
    </SiteShell>;
}
