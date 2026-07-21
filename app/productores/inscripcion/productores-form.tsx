"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DIFICULTADES_PRODUCTORES, iniciativaProductorSchema, LINEAS_PRODUCTIVAS, LUGARES_VENTA, NIVELES_MADUREZ_PRODUCTORES, PRODUCTOS_PRODUCTORES } from "@/lib/productores";

type Values = z.infer<typeof iniciativaProductorSchema>;
type ArrayField = "productos_obtenidos" | "donde_vende" | "principal_dificultad";

export function ProductoresForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(iniciativaProductorSchema),
    defaultValues: { vereda: "", productos_obtenidos: [], donde_vende: [], principal_dificultad: [] },
  });
  const products = watch("productos_obtenidos") || [];
  const sales = watch("donde_vende") || [];
  const difficulties = watch("principal_dificultad") || [];
  const message = (name: keyof Values) => errors[name]?.message ? <p className="text-sm text-red-600">{String(errors[name]?.message)}</p> : null;
  const checklist = (name: ArrayField, options: string[], selected: string[]) => <div className="grid gap-3 sm:grid-cols-2">{options.map(option => <Label key={option} className="flex items-center gap-3 rounded-xl border p-3 font-normal"><Checkbox checked={selected.includes(option)} onCheckedChange={checked => setValue(name, checked ? [...selected, option] : selected.filter(value => value !== option), { shouldValidate: true })}/>{option}</Label>)}</div>;

  async function onSubmit(values: Values) {
    setServerError("");
    try {
      const response = await fetch("/api/productores/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const text = await response.text();
      let payload: { error?: string; codigo_iniciativa?: string } | null = null;
      try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
      if (!response.ok) return setServerError(payload?.error || "No fue posible registrar la iniciativa.");
      if (!payload?.codigo_iniciativa) return setServerError("El registro no devolvió el código de la iniciativa.");
      router.push(`/productores/gracias?codigo=${encodeURIComponent(payload.codigo_iniciativa)}`);
    } catch {
      setServerError("No fue posible registrar la iniciativa.");
    }
  }

  return <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
    <section><h2 className="mb-4 text-lg font-bold">Datos del productor</h2><div className="grid gap-5 sm:grid-cols-2">
      {[['nombre_productor','Nombre del productor o representante'],['documento','Documento'],['celular','Celular'],['municipio','Municipio'],['vereda','Vereda, si aplica']] .map(([name,label]) => <div key={name}><Label>{label}</Label><Input {...register(name as keyof Values)}/>{message(name as keyof Values)}</div>)}
    </div></section>
    <section className="space-y-5"><h2 className="text-lg font-bold">Datos de la iniciativa</h2>
      <div><Label>Nombre de la iniciativa</Label><Input {...register("nombre_iniciativa")}/>{message("nombre_iniciativa")}</div>
      <div><Label>Año de inicio de la iniciativa</Label><Input type="number" min={1950} max={2026} {...register("anio_inicio", { valueAsNumber: true })}/>{message("anio_inicio")}</div>
      <div><Label>Línea productiva</Label><select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" {...register("linea_productiva")}><option value="">Seleccione</option>{LINEAS_PRODUCTIVAS.map(value=><option key={value}>{value}</option>)}</select>{message("linea_productiva")}</div>
      {watch("linea_productiva") === "Otra" && <div><Label>¿Cuál línea productiva?</Label><Input {...register("linea_productiva_otro")}/>{message("linea_productiva_otro")}</div>}
      <div><Label>Descripción de la iniciativa</Label><Textarea rows={4} {...register("descripcion_iniciativa")}/>{message("descripcion_iniciativa")}</div>
      <div><Label>Producto o servicio ofrecido</Label><Input {...register("producto_servicio")}/>{message("producto_servicio")}</div>
      <div><Label>Nivel de madurez</Label><select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" {...register("nivel_madurez")}><option value="">Seleccione</option>{NIVELES_MADUREZ_PRODUCTORES.map(value=><option key={value}>{value}</option>)}</select>{message("nivel_madurez")}</div>
      <div><Label className="mb-3 block">Productos obtenidos</Label>{checklist("productos_obtenidos", PRODUCTOS_PRODUCTORES, products)}{message("productos_obtenidos")}</div>
      {products.includes("Otro") && <div><Label>¿Cuál producto obtenido?</Label><Input {...register("productos_obtenidos_otro")}/>{message("productos_obtenidos_otro")}</div>}
      <div><Label className="mb-3 block">Dónde vende actualmente</Label>{checklist("donde_vende", LUGARES_VENTA, sales)}{message("donde_vende")}</div>
      {sales.includes("Otro") && <div><Label>¿Dónde vende?</Label><Input {...register("donde_vende_otro")}/>{message("donde_vende_otro")}</div>}
      <div><Label className="mb-3 block">Principal dificultad</Label>{checklist("principal_dificultad", DIFICULTADES_PRODUCTORES, difficulties)}{message("principal_dificultad")}</div>
      {difficulties.includes("Otra") && <div><Label>¿Cuál dificultad?</Label><Input {...register("principal_dificultad_otro")}/>{message("principal_dificultad_otro")}</div>}
    </section>
    {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Registrando..." : "Registrar iniciativa"}</Button>
  </form>;
}
