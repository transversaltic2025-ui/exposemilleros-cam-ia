"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecoverResult {
  success: boolean;
  evaluator?: {
    nombre_evaluador?: string;
    codigo_evaluador?: string;
    area_conocimiento?: string;
  };
  evaluatorAccessUrl?: string;
  assignmentOpen?: boolean;
  message?: string;
  error?: string;
}

export function RecoverAccessForm() {
  const [documento, setDocumento] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RecoverResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/evaluators/recover-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento_evaluador: documento }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: payload?.error ?? "No encontramos un evaluador registrado con ese documento.",
        });
        return;
      }

      setResult(payload);
    } catch {
      setResult({
        success: false,
        error: "No se pudo recuperar el acceso. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="documento_evaluador">Número de documento</Label>
          <Input
            id="documento_evaluador"
            value={documento}
            onChange={(event) => setDocumento(event.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          Buscar mis asignaciones
        </Button>
      </form>

      {result?.success && result.evaluatorAccessUrl ? (
        <div className="rounded-2xl border border-[#2E7D5B]/20 bg-[#2E7D5B]/10 p-5">
          <p className="font-sans text-lg font-extrabold text-[#2E7D5B]">
            Hola, {result.evaluator?.nombre_evaluador ?? "evaluador"}.{" "}
            {result.assignmentOpen === false ? "Tu registro está activo." : "Encontramos tu acceso."}
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {result.message ?? "Acceso encontrado. Puedes continuar con tus proyectos asignados."}
          </p>
          <Link
            className="mt-4 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]"
            href={result.evaluatorAccessUrl}
          >
            {result.assignmentOpen === false ? "Consultar mi panel" : "Entrar a mis proyectos asignados"}
          </Link>
        </div>
      ) : null}

      {result && !result.success ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">
            {result.error ?? "No encontramos un evaluador registrado con ese documento."}
          </p>
          <Link className="mt-4 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]" href="/evaluadores/registro">
            Registrarme como evaluador
          </Link>
        </div>
      ) : null}
    </div>
  );
}
