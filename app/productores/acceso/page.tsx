import { ProductoresAccessShell } from "@/components/productores-access-shell";
import { ProductoresAccessLogin } from "./productores-access-login";

export default function Page() {
  return <ProductoresAccessShell><div className="mx-auto max-w-lg">
    <p className="expo-eyebrow">Consulta restringida</p>
    <h1 className="expo-page-title mt-2">Acceso gestión productores campesinos</h1>
    <p className="mt-4 leading-7 text-[var(--color-muted)]">Ingrese con su documento y clave asignada para consultar las iniciativas campesinas registradas.</p>
    <ProductoresAccessLogin />
  </div></ProductoresAccessShell>;
}
