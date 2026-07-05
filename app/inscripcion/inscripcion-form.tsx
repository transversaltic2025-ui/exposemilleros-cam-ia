"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIAS_PRESENTACION,
  LINEAS_TEMATICAS,
  MODALIDADES_PARTICIPACION,
  SEMILLEROS,
} from "@/lib/constants";

const schema = z.object({
  titulo: z.string().min(5, "Escribe el titulo del proyecto."),
  resumen: z.string().min(30, "Incluye un resumen mas completo."),
  area_conocimiento: z.string().min(1, "Selecciona un area."),
  linea_investigacion: z.string().min(3, "Indica la linea."),
  municipio: z.string().min(2, "Indica el municipio."),
  integrantes: z.string().min(5, "Registra al menos un integrante."),
  instructor_nombre: z.string().min(3, "Indica el instructor."),
  instructor_correo: z.string().email("Correo invalido."),
  instructor_celular: z.string().min(7, "Celular invalido."),
});

type FormValues = z.infer<typeof schema>;

export function InscripcionForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit() {
    router.push("/inscripcion/gracias");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="titulo">Titulo del proyecto</Label>
        <Input id="titulo" {...register("titulo")} />
        {errors.titulo ? <p className="text-sm text-red-600">{errors.titulo.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="resumen">Resumen</Label>
        <Textarea id="resumen" rows={5} {...register("resumen")} />
        {errors.resumen ? <p className="text-sm text-red-600">{errors.resumen.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="area_conocimiento">Linea tematica</Label>
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
          {errors.area_conocimiento ? (
            <p className="text-sm text-red-600">{errors.area_conocimiento.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="linea_investigacion">Linea de investigacion</Label>
          <Input id="linea_investigacion" {...register("linea_investigacion")} />
          {errors.linea_investigacion ? (
            <p className="text-sm text-red-600">{errors.linea_investigacion.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="modalidad">Modalidad</Label>
          <select id="modalidad" className="h-9 rounded-md border bg-white px-3 text-sm">
            {MODALIDADES_PARTICIPACION.map((modalidad) => (
              <option key={modalidad}>{modalidad}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="semillero">Semillero</Label>
          <select id="semillero" className="h-9 rounded-md border bg-white px-3 text-sm">
            {SEMILLEROS.map((semillero) => (
              <option key={semillero}>{semillero}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categoria">Categoria</Label>
          <select id="categoria" className="h-9 rounded-md border bg-white px-3 text-sm">
            {CATEGORIAS_PRESENTACION.map((categoria) => (
              <option key={categoria}>{categoria}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="municipio">Municipio</Label>
          <Input id="municipio" {...register("municipio")} />
          {errors.municipio ? (
            <p className="text-sm text-red-600">{errors.municipio.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="integrantes">Integrantes</Label>
          <Input id="integrantes" placeholder="Nombres separados por coma" {...register("integrantes")} />
          {errors.integrantes ? (
            <p className="text-sm text-red-600">{errors.integrantes.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="instructor_nombre">Instructor</Label>
          <Input id="instructor_nombre" {...register("instructor_nombre")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="instructor_correo">Correo instructor</Label>
          <Input id="instructor_correo" type="email" {...register("instructor_correo")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="instructor_celular">Celular instructor</Label>
          <Input id="instructor_celular" {...register("instructor_celular")} />
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border border-dashed bg-slate-50 p-4">
        <Label htmlFor="archivo" className="inline-flex items-center gap-2">
          <Upload className="size-4" />
          Archivo del proyecto
        </Label>
        <Input id="archivo" type="file" accept=".pdf,.doc,.docx" />
        <p className="text-sm text-slate-600">Mock local. La carga real a Google Drive se conectara despues.</p>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        Registrar proyecto
      </Button>
    </form>
  );
}
