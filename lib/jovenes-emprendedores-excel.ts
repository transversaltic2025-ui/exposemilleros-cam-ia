import "server-only";

import ExcelJS from "exceljs";

type ExportRecord = Record<string, unknown>;

const columns = [
  { header: "Código de registro", key: "codigo_registro", width: 22 },
  { header: "Nombre completo", key: "nombre_completo", width: 30 },
  { header: "Documento", key: "documento", width: 18 },
  { header: "Teléfono", key: "telefono", width: 18 },
  { header: "Correo", key: "correo", width: 32 },
  { header: "Edad", key: "edad", width: 10 },
  { header: "Municipio de residencia", key: "municipio_residencia", width: 26 },
  { header: "Grupo Sisbén", key: "grupo_sisben", width: 16 },
  { header: "Estrato", key: "estrato", width: 12 },
  { header: "No recibió apoyo Gobernación últimos 2 años", key: "no_apoyo_gobernacion", width: 36 },
  { header: "No es beneficiario de programa del Estado", key: "no_beneficiario_estado", width: 36 },
  { header: "Tiempo de experiencia del emprendimiento", key: "tiempo_experiencia", width: 36 },
  { header: "Tipo joven emprendedor", key: "tipo_joven", width: 28 },
  { header: "Estado del registro", key: "estado_registro", width: 20 },
  { header: "Observaciones admin", key: "observaciones_admin", width: 38 },
  { header: "Fecha de registro", key: "fecha_registro", width: 22 },
];

function booleanLabel(value: unknown) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "";
}

export async function createJovenesEmprendedoresExcel(records: ExportRecord[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExpoSemilleros CAM IA";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Jóvenes emprendedores", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  worksheet.columns = columns;

  if (!records.length) {
    worksheet.addRow({ codigo_registro: "No hay jóvenes emprendedores registrados." });
  } else {
    records.forEach((record) => worksheet.addRow({
      codigo_registro: record.codigo_registro ?? "",
      nombre_completo: record.nombre_completo ?? "",
      documento: record.documento ?? "",
      telefono: record.telefono ?? "",
      correo: record.correo ?? "",
      edad: record.edad ?? "",
      municipio_residencia: record.municipio_residencia ?? "",
      grupo_sisben: record.grupo_sisben ?? "",
      estrato: record.estrato ?? "",
      no_apoyo_gobernacion: booleanLabel(record.no_apoyo_gobernacion_ultimos_2_anios),
      no_beneficiario_estado: booleanLabel(record.no_beneficiario_programa_estado),
      tiempo_experiencia: record.tiempo_experiencia_emprendimiento ?? "",
      tipo_joven: record.tipo_joven_emprendedor ?? "",
      estado_registro: record.estado_registro ?? "",
      observaciones_admin: record.observaciones_admin ?? "",
      fecha_registro: record.created_at ? new Date(String(record.created_at)) : "",
    }));
  }

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D3FA9" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.height = 42;
  worksheet.autoFilter = { from: "A1", to: "P1" };
  worksheet.getColumn("fecha_registro").numFmt = "dd/mm/yyyy hh:mm";
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });

  return workbook.xlsx.writeBuffer();
}
