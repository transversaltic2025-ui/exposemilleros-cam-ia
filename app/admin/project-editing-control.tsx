"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/status-pill";

type PublicModulesState = {
  projectRegistrationEnabled: boolean;
  projectEditingEnabled: boolean;
  evaluatorRegistrationEnabled: boolean;
};

export function PublicModulesControl({ initialState }: { initialState: PublicModulesState }) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const anyEnabled = Object.values(state).some(Boolean);

  async function toggleAll() {
    const enabled = !anyEnabled;
    setLoading(true); setMessage(null); setError(null);
    const response = await fetch("/api/admin/settings/public-modules", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectRegistrationEnabled: enabled, projectEditingEnabled: enabled, evaluatorRegistrationEnabled: enabled }),
    });
    const payload = await response.json().catch(() => null); setLoading(false);
    if (!response.ok) { setError(payload?.error ?? "No fue posible cambiar los estados."); return; }
    setState({ projectRegistrationEnabled: payload.projectRegistrationEnabled, projectEditingEnabled: payload.projectEditingEnabled, evaluatorRegistrationEnabled: payload.evaluatorRegistrationEnabled });
    setMessage(payload.message);
  }

  const rows = [
    ["Inscripción de proyectos", state.projectRegistrationEnabled],
    ["Edición de inscripciones", state.projectEditingEnabled],
    ["Registro de evaluadores", state.evaluatorRegistrationEnabled],
  ] as const;
  return <Card className="mt-6">
    <CardHeader><CardTitle>Módulos públicos de inscripción</CardTitle></CardHeader>
    <CardContent className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">{rows.map(([label, enabled]) => <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white/45 p-4"><span className="text-sm font-bold">{label}</span><StatusPill status={enabled ? (label === "Registro de evaluadores" ? "Activo" : "Activa") : label === "Registro de evaluadores" ? "Cerrado para nuevos registros" : "Cerrada"} /></div>)}</div>
      <p className="text-xs leading-5 text-[var(--color-muted)]">Cerrar el registro de evaluadores solo impide nuevas inscripciones. Los evaluadores existentes conservan recuperación de acceso, panel de asignaciones y evaluación oficial.</p>
      {message ? <p className="text-sm font-semibold text-green-700">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      <Button className="w-fit" variant={anyEnabled ? "outline" : "default"} disabled={loading} onClick={toggleAll}>{loading ? "Guardando…" : anyEnabled ? "Cerrar inscripciones públicas" : "Abrir inscripciones públicas"}</Button>
    </CardContent>
  </Card>;
}
