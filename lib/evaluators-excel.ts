import "server-only";

import ExcelJS from "exceljs";

type RowValue = string | number | boolean | Date | null | undefined;

export function createEvaluatorWorkbook(sheetName: string, columns: Array<{ header: string; key: string; width: number }>) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExpoSemilleros CAM IA";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(sheetName, { views: [{ state: "frozen", ySplit: 1 }] });
  worksheet.columns = columns;
  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D3FA9" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.height = 28;
  worksheet.autoFilter = { from: "A1", to: `${worksheet.getColumn(columns.length).letter}1` };
  return { workbook, worksheet };
}

export function addEvaluatorRows(
  worksheet: ExcelJS.Worksheet,
  rows: Record<string, RowValue>[],
  dateKeys: string[],
) {
  if (!rows.length) worksheet.addRow({ [worksheet.columns[0].key as string]: "No hay evaluadores registrados." });
  else rows.forEach(row => worksheet.addRow(row));
  dateKeys.forEach(key => { worksheet.getColumn(key).numFmt = "dd/mm/yyyy hh:mm"; });
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });
}
