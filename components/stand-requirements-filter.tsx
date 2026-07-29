"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const STAND_REQUIREMENTS = [
  { value: "electricidad", label: "Punto eléctrico" },
  { value: "mobiliario", label: "Mesa o mobiliario" },
  { value: "prototipo", label: "Prototipo funcional" },
  { value: "otro", label: "Otro elemento requerido" },
] as const;

export type StandRequirement = (typeof STAND_REQUIREMENTS)[number]["value"];

export function StandRequirementsFilter({ selected }: { selected: StandRequirement[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(values: StandRequirement[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("requerimiento");
    if (values.length) params.set("requerimientos", values.join(","));
    else params.delete("requerimientos");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggle(value: StandRequirement) {
    navigate(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  }

  return <fieldset className="expo-panel mb-6 bg-white p-4 sm:p-5">
    <legend className="px-1 text-sm font-bold text-[var(--color-text)]">Filtrar por requerimientos del stand</legend>
    <div className="mt-3 flex flex-wrap gap-3">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border bg-white/60 px-3 py-2 text-sm font-semibold">
        <input type="checkbox" checked={selected.length === 0} onChange={() => navigate([])} />
        Todos los proyectos
      </label>
      {STAND_REQUIREMENTS.map(option => <label key={option.value} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border bg-white/60 px-3 py-2 text-sm font-semibold">
        <input type="checkbox" checked={selected.includes(option.value)} onChange={() => toggle(option.value)} />
        {option.label}
      </label>)}
    </div>
    <p className="mt-3 text-xs text-[var(--color-muted)]">Al seleccionar varias opciones se muestran los proyectos que cumplen al menos una.</p>
  </fieldset>;
}
