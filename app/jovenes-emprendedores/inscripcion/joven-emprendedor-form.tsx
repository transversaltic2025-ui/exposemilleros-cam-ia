"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ESTRATOS,
  GRUPOS_SISBEN,
  jovenEmprendedorSchema,
  MUNICIPIOS_META,
  TIEMPOS_EXPERIENCIA,
  TIPOS_JOVEN_EMPRENDEDOR,
  type JovenEmprendedorInput,
} from "@/lib/jovenes-emprendedores";

export function JovenEmprendedorForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<JovenEmprendedorInput>({
    resolver: zodResolver(jovenEmprendedorSchema),
    defaultValues: {
      no_apoyo_gobernacion_ultimos_2_anios: false,
      no_beneficiario_programa_estado: false,
    },
  });

  const errorFor = (name: keyof JovenEmprendedorInput) =>
    errors[name]?.message ? <p className="mt-1 text-sm text-red-600">{String(errors[name]?.message)}</p> : null;

  async function onSubmit(values: JovenEmprendedorInput) {
    setServerError("");
    try {
      const response = await fetch("/api/jovenes-emprendedores/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json() as { error?: string; codigo_registro?: string };
      if (!response.ok || !payload.codigo_registro) {
        setServerError(payload.error || "No fue posible registrar la inscripción.");
        return;
      }
      router.push(`/jovenes-emprendedores/gracias?codigo=${encodeURIComponent(payload.codigo_registro)}`);
    } catch {
      setServerError("No fue posible registrar la inscripción. Verifique su conexión e intente nuevamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8">
      <section>
        <h2 className="mb-5 text-xl font-black">Datos personales</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre completo" error={errorFor("nombre_completo")}><Input {...register("nombre_completo")} /></Field>
          <Field label="Documento" error={errorFor("documento")}><Input inputMode="numeric" {...register("documento")} /></Field>
          <Field label="Teléfono" error={errorFor("telefono")}><Input inputMode="tel" {...register("telefono")} /></Field>
          <Field label="Correo" error={errorFor("correo")}><Input type="email" {...register("correo")} /></Field>
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-black">Requisitos</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Edad" error={errorFor("edad")}>
            <Input
              type="number"
              min={18}
              max={28}
              placeholder="18 a 28 años"
              {...register("edad", { valueAsNumber: true })}
            />
            <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
              Condición: ser joven emprendedor entre los 18 y 28 años.
            </p>
          </Field>
          <SelectField label="Municipio de residencia" error={errorFor("municipio_residencia")} register={register("municipio_residencia")} options={MUNICIPIOS_META} />
          <SelectField label="Grupo del Sisbén" error={errorFor("grupo_sisben")} register={register("grupo_sisben")} options={GRUPOS_SISBEN} />
          <SelectField label="Estrato socioeconómico" error={errorFor("estrato")} register={register("estrato")} options={ESTRATOS} />
          <SelectField label="Tiempo de experiencia del emprendimiento" error={errorFor("tiempo_experiencia_emprendimiento")} register={register("tiempo_experiencia_emprendimiento")} options={TIEMPOS_EXPERIENCIA} />
          <SelectField label="Tipo de joven emprendedor" error={errorFor("tipo_joven_emprendedor")} register={register("tipo_joven_emprendedor")} options={TIPOS_JOVEN_EMPRENDEDOR} />
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-black">Declaraciones obligatorias</h2>
        <div className="grid gap-4">
          <Declaration
            checked={watch("no_apoyo_gobernacion_ultimos_2_anios")}
            onChange={(checked) => setValue("no_apoyo_gobernacion_ultimos_2_anios", checked === true, { shouldValidate: true })}
            text="Declaro no haber recibido apoyo para emprendimiento por parte de la Gobernación del Meta durante los últimos dos (2) años."
            error={errorFor("no_apoyo_gobernacion_ultimos_2_anios")}
          />
          <Declaration
            checked={watch("no_beneficiario_programa_estado")}
            onChange={(checked) => setValue("no_beneficiario_programa_estado", checked === true, { shouldValidate: true })}
            text="Declaro no ser beneficiario de ningún programa del Estado relacionado con el fortalecimiento de proyectos productivos."
            error={errorFor("no_beneficiario_programa_estado")}
          />
        </div>
      </section>

      {serverError ? <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{serverError}</p> : null}
      <Button type="submit" className="h-12 w-full sm:w-fit" disabled={isSubmitting}>
        {isSubmitting ? "Registrando..." : "Registrar joven emprendedor"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: React.ReactNode; children: React.ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-2">{children}</div>{error}</div>;
}

function SelectField({ label, error, register, options }: {
  label: string;
  error?: React.ReactNode;
  register: React.SelectHTMLAttributes<HTMLSelectElement>;
  options: readonly string[];
}) {
  return (
    <Field label={label} error={error}>
      <select className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3" {...register}>
        <option value="">Seleccione</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  );
}

function Declaration({ checked, onChange, text, error }: {
  checked: boolean;
  onChange: (checked: boolean | "indeterminate") => void;
  text: string;
  error?: React.ReactNode;
}) {
  return (
    <div>
      <Label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-white/55 p-4 font-normal leading-6">
        <Checkbox className="mt-1" checked={checked} onCheckedChange={onChange} />
        <span>{text}</span>
      </Label>
      {error}
    </div>
  );
}
