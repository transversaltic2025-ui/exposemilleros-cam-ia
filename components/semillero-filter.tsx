"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const SEMILLEROS = [
  "Cienciatec",
  "AgroadminLab",
  "Aspillanos",
  "Tecnobioma",
  "Administrativo Naranjos",
  "Nido",
  "Pecuario",
  "Agrícola",
  "Ambiental",
  "Napecam",
  "Sibari",
  "Otro",
] as const;

export function SemilleroFilter({ selectedSemillero }: { selectedSemillero?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("semillero", value);
    } else {
      params.delete("semillero");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="expo-panel mb-6 bg-white p-4 sm:p-5">
      <label
        htmlFor="semillero-filter"
        className="mb-2 block text-sm font-bold text-[var(--color-text)]"
      >
        Filtrar por semillero de investigación
      </label>
      <select
        id="semillero-filter"
        value={selectedSemillero ?? ""}
        onChange={(event) => handleChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 sm:max-w-md"
      >
        <option value="">Todos los semilleros</option>
        {SEMILLEROS.map((semillero) => (
          <option key={semillero} value={semillero}>
            {semillero}
          </option>
        ))}
      </select>
    </div>
  );
}
