"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/status-pill";

type PublicModulesState = {
  projectRegistrationEnabled: boolean;
  projectEditingEnabled: boolean;
  evaluatorRegistrationEnabled: boolean;
  producersRegistrationEnabled: boolean;
  youngEntrepreneursRegistrationEnabled: boolean;
};

type StateKey = keyof PublicModulesState;
type ConfigKey =
  | "inscripcion_proyectos_habilitada"
  | "edicion_inscripciones_habilitada"
  | "registro_evaluadores_habilitado"
  | "productores_inscripcion_habilitada"
  | "jovenes_emprendedores_inscripcion_habilitada";

const modules: Array<{
  stateKey: StateKey;
  configKey: ConfigKey;
  title: string;
  description: string;
  evaluator?: boolean;
}> = [
  {
    stateKey: "projectRegistrationEnabled",
    configKey: "inscripcion_proyectos_habilitada",
    title: "Inscripción de proyectos",
    description: "Permite activar o desactivar la inscripción pública de proyectos de investigación.",
  },
  {
    stateKey: "projectEditingEnabled",
    configKey: "edicion_inscripciones_habilitada",
    title: "Edición de inscripciones",
    description: "Permite activar o desactivar la edición pública de inscripciones de proyectos.",
  },
  {
    stateKey: "evaluatorRegistrationEnabled",
    configKey: "registro_evaluadores_habilitado",
    title: "Registro de evaluadores",
    description: "Al desactivar este módulo se bloquean nuevos registros, pero los evaluadores ya registrados pueden recuperar acceso y evaluar sus proyectos asignados.",
    evaluator: true,
  },
  {
    stateKey: "producersRegistrationEnabled",
    configKey: "productores_inscripcion_habilitada",
    title: "Inscripción de productores campesinos",
    description: "Permite activar o desactivar la inscripción pública de iniciativas de productores campesinos.",
  },
  {
    stateKey: "youngEntrepreneursRegistrationEnabled",
    configKey: "jovenes_emprendedores_inscripcion_habilitada",
    title: "Inscripción de jóvenes emprendedores",
    description: "Permite activar o desactivar la inscripción pública de jóvenes emprendedores.",
  },
];

export function PublicModulesControl({ initialState }: { initialState: PublicModulesState }) {
  const [state, setState] = useState(initialState);
  const [loadingKey, setLoadingKey] = useState<ConfigKey | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function toggle(stateKey: StateKey, configKey: ConfigKey) {
    const enabled = !state[stateKey];
    setLoadingKey(configKey);
    setMessage("");
    setError("");
    const response = await fetch("/api/admin/settings/public-modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: configKey, enabled }),
    });
    const payload = await response.json().catch(() => null);
    setLoadingKey(null);
    if (!response.ok) {
      setError(payload?.error ?? "No fue posible actualizar el módulo.");
      return;
    }
    setState((current) => ({ ...current, [stateKey]: enabled }));
    setMessage(payload.message);
  }

  return (
    <Card className="mt-6 bg-white/75">
      <CardHeader>
        <CardTitle>Módulos públicos</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">Active o desactive individualmente los registros públicos del sistema.</p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {modules.map((module) => {
          const enabled = state[module.stateKey];
          return (
            <div key={module.configKey} className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white/60 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-extrabold">{module.title}</p>
                  <StatusPill status={enabled ? (module.evaluator ? "Activo" : "Activa") : module.evaluator ? "Cerrado para nuevos registros" : "Cerrada"} />
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">{module.description}</p>
              </div>
              <Button
                variant={enabled ? "outline" : "default"}
                disabled={loadingKey === module.configKey}
                onClick={() => toggle(module.stateKey, module.configKey)}
              >
                {loadingKey === module.configKey ? "Guardando..." : enabled ? "Desactivar" : "Activar"}
              </Button>
            </div>
          );
        })}
        {message ? <p className="text-sm font-semibold text-green-700">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
