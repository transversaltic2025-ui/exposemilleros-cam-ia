"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  recomendacion_final: z.string().min(1),
  concepto_evaluador: z.string().min(20),
});

type FormValues = z.infer<typeof schema>;

export function EvaluationForm() {
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
    },
  });

  const archivoAbierto = useWatch({ control, name: "archivo_abierto" });

  if (isSubmitSuccessful) {
    return (
      <div className="rounded-lg border bg-emerald-50 p-5 text-emerald-900">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-5" />
          Evaluacion mock enviada
        </div>
        <p className="mt-2 text-sm">
          En la integracion real se guardara en Google Sheets y se comparara con el analisis IA.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(() => undefined)} className="grid gap-5">
      <label className="flex items-start gap-3 rounded-lg border bg-slate-50 p-4 text-sm">
        <Checkbox
          checked={archivoAbierto}
          onCheckedChange={(checked) => setValue("archivo_abierto", checked === true)}
        />
        <span>
          Confirmo que abri y lei el archivo del proyecto antes de evaluar.
          {errors.archivo_abierto ? (
            <span className="block text-red-600">{errors.archivo_abierto.message}</span>
          ) : null}
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["puntaje_pertinencia", "Pertinencia"],
          ["puntaje_innovacion", "Innovacion"],
          ["puntaje_metodologia", "Metodologia"],
          ["puntaje_impacto", "Impacto"],
          ["puntaje_comunicacion", "Comunicacion"],
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
        <Label htmlFor="recomendacion_final">Recomendacion final</Label>
        <select
          id="recomendacion_final"
          className="h-9 rounded-md border bg-white px-3 text-sm"
          {...register("recomendacion_final")}
        >
          <option value="">Seleccionar</option>
          <option value="destacado">Destacado</option>
          <option value="aprobar">Aprobar</option>
          <option value="ajustar">Ajustar</option>
          <option value="no_recomendado">No recomendado</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="concepto_evaluador">Concepto del evaluador</Label>
        <Textarea id="concepto_evaluador" rows={4} {...register("concepto_evaluador")} />
      </div>

      <Button type="submit" size="lg">
        Enviar evaluacion
      </Button>
    </form>
  );
}
