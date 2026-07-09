"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LINEAS_TEMATICAS } from "@/lib/constants";

const schema = z.object({
  nombre_evaluador: z.string().min(3, "Indica tu nombre."),
  correo_evaluador: z.string().email("Correo invalido."),
  celular_evaluador: z.string().min(7, "Celular invalido."),
  documento_evaluador: z.string().min(5, "Documento invalido."),
  institucion_evaluador: z.string().min(2, "Indica la institucion."),
  area_conocimiento: z.string().min(1, "Selecciona un area."),
});

type FormValues = z.infer<typeof schema>;

export function EvaluadorForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)));

    const response = await fetch("/api/evaluators/register", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setSubmitError(payload?.error ?? "No se pudo registrar el evaluador.");
      return;
    }

    const payload = await response.json();
    const params = new URLSearchParams({
      token: String(payload.evaluator?.token_acceso ?? payload.evaluador?.token_acceso ?? ""),
      count: String(payload.assignmentsCount ?? payload.assignments?.length ?? 0),
      url: String(payload.evaluatorAccessUrl ?? ""),
      message: String(payload.message ?? "Evaluador registrado."),
      assignmentOpen: String(payload.assignmentOpen ?? true),
    });

    router.push(`/evaluadores/gracias?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="nombre_evaluador">Nombre completo</Label>
          <Input id="nombre_evaluador" {...register("nombre_evaluador")} />
          {errors.nombre_evaluador ? <p className="text-sm font-semibold text-red-700">{errors.nombre_evaluador.message}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="institucion_evaluador">Institucion</Label>
          <Input id="institucion_evaluador" {...register("institucion_evaluador")} />
          {errors.institucion_evaluador ? <p className="text-sm font-semibold text-red-700">{errors.institucion_evaluador.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="correo_evaluador">Correo</Label>
          <Input id="correo_evaluador" type="email" {...register("correo_evaluador")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="celular_evaluador">Celular</Label>
          <Input id="celular_evaluador" {...register("celular_evaluador")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="documento_evaluador">Documento</Label>
          <Input id="documento_evaluador" {...register("documento_evaluador")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="area_conocimiento">Area de conocimiento</Label>
          <select
            id="area_conocimiento"
            className="h-11 rounded-xl border border-[var(--color-border)] bg-white/70 px-3 text-sm"
            {...register("area_conocimiento")}
          >
            <option value="">Seleccionar</option>
            {LINEAS_TEMATICAS.map((linea) => (
              <option key={linea}>{linea}</option>
            ))}
          </select>
        </div>
      </div>

      {submitError ? <p className="text-sm font-semibold text-red-700">{submitError}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        Registrar evaluador
      </Button>
    </form>
  );
}
