import { ProductoresAccessShell } from "@/components/productores-access-shell";
import { findProductoresAccessByToken } from "@/lib/productores-access";
import { getProductoresInitiatives } from "@/lib/productores-export";
import { UnauthorizedAccess } from "./unauthorized";
import { InitiativesPanel } from "./initiatives-panel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await findProductoresAccessByToken(token);
  if (!access) return <ProductoresAccessShell><UnauthorizedAccess /></ProductoresAccessShell>;
  const initiatives = await getProductoresInitiatives();
  return <ProductoresAccessShell>
    <p className="expo-eyebrow">Acceso autorizado · {access.nombre}</p>
    <h1 className="expo-page-title mt-2">Panel de iniciativas campesinas</h1>
    <p className="mt-3 text-[var(--color-muted)]">Consulta de iniciativas productivas campesinas registradas.</p>
    <InitiativesPanel token={token} initiatives={initiatives} />
  </ProductoresAccessShell>;
}
