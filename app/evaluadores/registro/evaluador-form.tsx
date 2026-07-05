"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LINEAS_TEMATICAS } from "@/lib/constants";

const schema = z.object({
  nombre: z.string().min(3, "Indica tu nombre."),
  correo: z.string().email("Correo invalido."),
  celular: z.string().min(7, "Celular invalido."),
  documento: z.string().min(5, "Documento invalido."),
  entidad: z.string().min(2, "Indica la entidad."),
  area_conocimiento: z.string().min(1, "Selecciona un area."),
  disponibilidad: z.string().min(1, "Selecciona disponibilidad."),
});

type FormValues = z.infer<typeof schema>;

export function EvaluadorForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit() {
    router.push("/evaluadores/gracias");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input id="nombre" {...register("nombre")} />
          {errors.nombre ? <p className="text-sm text-red-600">{errors.nombre.message}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="entidad">Entidad</Label>
          <Input id="entidad" {...register("entidad")} />
          {errors.entidad ? <p className="text-sm text-red-600">{errors.entidad.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" type="email" {...register("correo")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="celular">Celular</Label>
          <Input id="celular" {...register("celular")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="documento">Documento</Label>
          <Input id="documento" {...register("documento")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="area_conocimiento">Area de conocimiento</Label>
          <select
            id="area_conocimiento"
            className="h-9 rounded-md border bg-white px-3 text-sm"
            {...register("area_conocimiento")}
          >
            <option value="">Seleccionar</option>
            {LINEAS_TEMATICAS.map((linea) => (
              <option key={linea}>{linea}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="disponibilidad">Disponibilidad</Label>
          <select
            id="disponibilidad"
            className="h-9 rounded-md border bg-white px-3 text-sm"
            {...register("disponibilidad")}
          >
            <option value="">Seleccionar</option>
            <option>Manana</option>
            <option>Tarde</option>
            <option>Jornada completa</option>
          </select>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        Registrar evaluador
      </Button>
    </form>
  );
}
