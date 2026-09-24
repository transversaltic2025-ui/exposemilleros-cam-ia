import { SiteShell } from "@/components/site-shell";
import { CertificateLookup } from "./certificate-lookup";

export default function CertificateLookupPage() {
  return <SiteShell><div className="mx-auto max-w-3xl"><h1 className="expo-page-title">Consulta de certificados</h1><p className="my-5 text-[var(--color-muted)]">Consulte y descargue sus certificados firmados ingresando su número de documento.</p><CertificateLookup /></div></SiteShell>;
}
