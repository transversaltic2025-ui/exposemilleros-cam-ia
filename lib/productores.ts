import { z } from "zod";

export const LINEAS_PRODUCTIVAS = ["Agricultura", "Pecuaria", "Agroindustria", "Transformación de alimentos", "Apicultura", "Piscicultura", "Avicultura", "Ganadería", "Cacao", "Café", "Plátano", "Frutales", "Hortalizas", "Lácteos", "Artesanías rurales", "Turismo rural", "Emprendimiento rural", "Otra"];
export const NIVELES_MADUREZ_PRODUCTORES = ["Idea", "Producción inicial", "Producto listo para vender", "Ya tiene ventas", "En crecimiento"];
export const PRODUCTOS_PRODUCTORES = ["Producto fresco", "Producto transformado", "Prototipo", "Marca", "Empaque", "Canal de venta", "Catálogo", "Certificación", "Registro sanitario", "Otro"];
export const LUGARES_VENTA = ["No vende todavía", "Finca o unidad productiva", "Plaza de mercado", "Tienda local", "Ferias", "Intermediarios", "Restaurantes", "Clientes directos", "Otro"];
export const DIFICULTADES_PRODUCTORES = ["Falta de capital", "Falta de maquinaria o equipos", "Falta de empaque", "Falta de transporte", "Falta de clientes", "Falta de capacitación", "Falta de registro sanitario", "Falta de marca o imagen comercial", "Falta de asistencia técnica", "Falta de financiación", "Otra"];

export const iniciativaProductorSchema = z.object({
  nombre_productor: z.string().trim().min(2, "Ingrese el nombre del productor."),
  documento: z.string().trim().min(5, "Ingrese el documento."),
  celular: z.string().trim().min(7, "Ingrese el celular."),
  municipio: z.string().trim().min(2, "Ingrese el municipio."),
  vereda: z.string().trim().optional(),
  nombre_iniciativa: z.string().trim().min(3, "Ingrese el nombre de la iniciativa."),
  anio_inicio: z.number({ message: "Ingrese el año de inicio de la iniciativa." }).int("Debe ingresar un año válido.").min(1950, "El año mínimo es 1950.").max(2026, "El año máximo es 2026."),
  linea_productiva: z.string().min(1, "Seleccione una línea productiva."),
  linea_productiva_otro: z.string().trim().optional(),
  descripcion_iniciativa: z.string().trim().min(10, "Describa la iniciativa."),
  producto_servicio: z.string().trim().min(2, "Indique el producto o servicio."),
  nivel_madurez: z.string().min(1, "Seleccione el nivel de madurez."),
  productos_obtenidos: z.array(z.string()).min(1, "Seleccione al menos un producto obtenido."),
  productos_obtenidos_otro: z.string().trim().optional(),
  donde_vende: z.array(z.string()).min(1, "Seleccione al menos un lugar donde vende."),
  donde_vende_otro: z.string().trim().optional(),
  principal_dificultad: z.array(z.string()).min(1, "Seleccione al menos una dificultad principal."),
  principal_dificultad_otro: z.string().trim().optional(),
}).superRefine((v, ctx) => {
  const requireOther = (condition: boolean, field: keyof typeof v, message: string) => {
    if (condition && !String(v[field] ?? "").trim()) ctx.addIssue({ code: "custom", path: [field], message });
  };
  requireOther(v.linea_productiva === "Otra", "linea_productiva_otro", "Indique cuál línea productiva.");
  requireOther(v.productos_obtenidos.includes("Otro"), "productos_obtenidos_otro", "Indique cuál producto obtuvo.");
  requireOther(v.donde_vende.includes("Otro"), "donde_vende_otro", "Indique dónde vende.");
  requireOther(v.principal_dificultad.includes("Otra"), "principal_dificultad_otro", "Indique cuál dificultad.");
});

export function nivelTendencia(promedio: number) {
  return promedio >= 4 ? "Alto potencial" : promedio >= 3 ? "Potencial medio" : "Requiere fortalecimiento";
}

export function normalizarDocumento(value: string) {
  return value.trim().replace(/[\s.,-]+/g, "");
}
