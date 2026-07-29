import "server-only";

import ExcelJS from "exceljs";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { findProductoresAccessByToken } from "@/lib/productores-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function canExportProductores(request: Request) {
  if (await isAdminAuthenticated()) return true;
  const token = new URL(request.url).searchParams.get("token");
  return Boolean(await findProductoresAccessByToken(token));
}

export async function getProductoresInitiatives() {
  const { data, error } = await createSupabaseServerClient()
    .from("productores_iniciativas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function displayList(value: unknown) {
  return Array.isArray(value) ? value.filter(Boolean).join(", ") : String(value || "");
}

export async function createProductoresExcel(items: Record<string, unknown>[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExpoSemilleros CAM IA";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Iniciativas campesinas", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = [
    { header: "Código", key: "codigo", width: 22 },
    { header: "Nombre del productor", key: "productor", width: 28 },
    { header: "Documento", key: "documento", width: 18 },
    { header: "Celular", key: "celular", width: 17 },
    { header: "Municipio", key: "municipio", width: 20 },
    { header: "Vereda", key: "vereda", width: 22 },
    { header: "Nombre de la iniciativa", key: "iniciativa", width: 32 },
    { header: "Año de inicio", key: "anio", width: 14 },
    { header: "Línea productiva", key: "linea", width: 25 },
    { header: "Descripción de la iniciativa", key: "descripcion", width: 45 },
    { header: "Producto o servicio", key: "producto", width: 30 },
    { header: "Nivel de madurez", key: "madurez", width: 24 },
    { header: "Productos obtenidos", key: "productos_obtenidos", width: 35 },
    { header: "Dónde vende actualmente", key: "donde_vende", width: 35 },
    { header: "Principal dificultad", key: "dificultad", width: 38 },
    { header: "Estado del registro", key: "estado_registro", width: 20 },
    { header: "Estado análisis IA", key: "estado_ia", width: 20 },
    { header: "Fecha de registro", key: "fecha", width: 22 },
  ];

  for (const item of items) {
    worksheet.addRow({
      codigo: item.codigo_iniciativa || "",
      productor: item.nombre_productor || "",
      documento: item.documento || "",
      celular: item.celular || "",
      municipio: item.municipio || "",
      vereda: item.vereda || "",
      iniciativa: item.nombre_iniciativa || "",
      anio: item.anio_inicio || "",
      linea: item.linea_productiva || "",
      descripcion: item.descripcion_iniciativa || "",
      producto: item.producto_servicio || "",
      madurez: item.nivel_madurez || "",
      productos_obtenidos: displayList(item.productos_obtenidos),
      donde_vende: displayList(item.donde_vende),
      dificultad: displayList(item.principal_dificultad),
      estado_registro: item.estado_registro || "",
      estado_ia: item.estado_analisis_ia || "",
      fecha: item.created_at ? new Date(String(item.created_at)) : "",
    });
  }

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D3FA9" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.height = 28;
  worksheet.autoFilter = { from: "A1", to: "R1" };
  worksheet.getColumn("fecha").numFmt = "dd/mm/yyyy hh:mm";
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });

  return workbook.xlsx.writeBuffer();
}
