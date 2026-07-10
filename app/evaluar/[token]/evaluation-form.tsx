"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calculateEvaluationSimulation } from "@/lib/evaluation-simulation";
import type { EvaluationCriterion } from "@/types";

const schema = z.object({
  archivo_abierto: z.boolean().refine(Boolean, "Debes abrir y leer el archivo."),
  puntaje_pertinencia: z.number().min(0).max(20),
  puntaje_innovacion: z.number().min(0).max(20),
  puntaje_metodologia: z.number().min(0).max(20),
  puntaje_impacto: z.number().min(0).max(20),
  puntaje_comunicacion: z.number().min(0).max(20),
  observaciones: z.string().min(10),
  fortalezas: z.string().min(10),
  oportunidades: z.string().min(10),
  concepto_evaluador: z.string().min(20),
  detalles: z.array(z.object({
    criterio_id: z.string(),
    puntaje: z.number().min(0),
    observacion_criterio: z.string().optional(),
  })).optional(),
});

type FormValues = z.infer<typeof schema>;

export function EvaluationForm({
  token,
  criterios,
  mode = "official",
}: {
  token?: string;
  criterios: EvaluationCriterion[];
  mode?: "official" | "training";
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [evaluatorAccessUrl, setEvaluatorAccessUrl] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<{
    puntaje_total: number;
    promedio: number;
    porcentaje: number;
    nivel_tendencia: string;
    concepto_evaluador: string;
  } | null>(null);
  const hasCriteria = criterios.length > 0;
  const isTraining = mode === "training";
  const normalizedCriteria = criterios.map((criterio) => ({
    ...criterio,
    id: criterio.id ?? criterio.criterio_id ?? "",
    nombre_criterio: criterio.nombre_criterio ?? criterio.nombre ?? "Criterio",
  }));
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      archivo_abierto: false,
      puntaje_pertinencia: 0,
      puntaje_innovacion: 0,
      puntaje_metodologia: 0,
      puntaje_impacto: 0,
      puntaje_comunicacion: 0,
      detalles: normalizedCriteria.map((criterio) => ({
        criterio_id: criterio.id,
        puntaje: 0,
        observacion_criterio: "",
      })),
    },
  });

  const archivoAbierto = useWatch({ control, name: "archivo_abierto" });

  useEffect(() => {
    if (!evaluatorAccessUrl) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.location.href = evaluatorAccessUrl;
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [evaluatorAccessUrl]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);

    if (isTraining) {
      setSimulationResult(calculateEvaluationSimulation(values, normalizedCriteria));
      return;
    }

    if (!token) {
      setSubmitError("No se pudo enviar la evaluación.");
      return;
    }

    const response = await fetch(`/api/evaluations/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setSubmitError(payload?.error ?? "No se pudo enviar la evaluación.");
      return;
    }

    const payload = await response.json();
    setSuccessMessage(payload.message ?? "Evaluación registrada correctamente.");
    setEvaluatorAccessUrl(payload.evaluatorAccessUrl ?? null);
  }

  if (!isTraining && isSubmitSuccessful && !submitError) {
    return (
      <div className="rounded-2xl border border-[#2E7D5B]/20 bg-[#2E7D5B]/10 p-5 text-[#2E7D5B]">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-5" />
          {successMessage ?? "Evaluación registrada correctamente."}
        </div>
        <p className="mt-2 text-sm">
          Volverá a sus proyectos asignados en unos segundos para continuar con las evaluaciones pendientes.
        </p>
        {evaluatorAccessUrl ? (
          <Link className="mt-4 inline-flex h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-secondary)]" href={evaluatorAccessUrl}>
            Volver a mis proyectos asignados
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {isTraining ? (
        <Card className="border-amber-400/40 bg-amber-50/80">
          <CardContent className="py-4">
            <p className="text-sm font-black uppercase tracking-wide text-amber-700">MODO CAPACITACIÓN</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Esta evaluación es solo para práctica y capacitación. No se guardará como evaluación oficial del proyecto.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-white/48 p-4 text-sm">
        <Checkbox
          checked={archivoAbierto}
          onCheckedChange={(checked) => setValue("archivo_abierto", checked === true)}
        />
        <span>
          Confirmo que abrí y leí el archivo del proyecto antes de evaluar.
          {errors.archivo_abierto ? (
            <span className="block font-semibold text-red-700">{errors.archivo_abierto.message}</span>
          ) : null}
        </span>
      </label>

      {hasCriteria ? (
        <div className="grid gap-4">
          {normalizedCriteria.map((criterio, index) => (
            <div key={criterio.id} className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white/45 p-4">
              <div>
                <Label htmlFor={`criterio-${criterio.id}`}>
                  {criterio.nombre_criterio ?? criterio.nombre}
                </Label>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{criterio.descripcion}</p>
              </div>
              <input type="hidden" {...register(`detalles.${index}.criterio_id`)} />
              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <div className="grid gap-2">
                  <Label htmlFor={`criterio-${criterio.id}`}>Puntaje</Label>
                  <Input
                    id={`criterio-${criterio.id}`}
                    type="number"
                    min={0}
                    max={criterio.puntaje_maximo}
                    {...register(`detalles.${index}.puntaje`, { valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`observacion-${criterio.id}`}>Observación del criterio</Label>
                  <Textarea
                    id={`observacion-${criterio.id}`}
                    rows={2}
                    {...register(`detalles.${index}.observacion_criterio`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-5">
          {[
            ["puntaje_pertinencia", "Pertinencia"],
            ["puntaje_innovacion", "Innovación"],
            ["puntaje_metodologia", "Metodología"],
            ["puntaje_impacto", "Impacto"],
            ["puntaje_comunicacion", "Comunicación"],
          ].map(([name, label]) => (
            <div key={name} className="grid gap-2">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                type="number"
                min={0}
                max={20}
                {...register(name as keyof FormValues, { valueAsNumber: true })}
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea id="observaciones" rows={3} {...register("observaciones")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="fortalezas">Fortalezas</Label>
        <Textarea id="fortalezas" rows={3} {...register("fortalezas")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="oportunidades">Oportunidades de mejora</Label>
        <Textarea id="oportunidades" rows={3} {...register("oportunidades")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="concepto_evaluador">Concepto del evaluador</Label>
        <Textarea id="concepto_evaluador" rows={4} {...register("concepto_evaluador")} />
      </div>

      {isTraining && simulationResult ? (
        <Card className="border-[var(--color-primary)]/20 bg-white/80">
          <CardContent className="grid gap-3 py-5">
            <p className="text-sm font-black uppercase tracking-wide text-[var(--color-primary)]">Evaluación de práctica completada</p>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Este resultado no fue guardado como evaluación oficial.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <ResultStat label="Puntaje total simulado" value={`${simulationResult.puntaje_total}`} />
              <ResultStat label="Porcentaje simulado" value={`${simulationResult.porcentaje}%`} />
              <ResultStat label="Nivel de tendencia simulado" value={simulationResult.nivel_tendencia} />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/60 p-4">
              <p className="expo-eyebrow">Concepto escrito</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">{simulationResult.concepto_evaluador}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {submitError ? <p className="text-sm font-semibold text-red-700">{submitError}</p> : null}

      <Button type="submit" size="lg">
        {isTraining ? "Simular envío de evaluación" : "Enviar evaluación"}
      </Button>
    </form>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white/60 p-4">
      <p className="expo-eyebrow">{label}</p>
      <p className="mt-2 font-sans text-lg font-extrabold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
