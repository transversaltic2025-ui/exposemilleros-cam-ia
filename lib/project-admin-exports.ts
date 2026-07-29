import "server-only";

import ExcelJS from "exceljs";

type ProjectRow = Record<string, unknown> & { id: string };
type MemberRow = Record<string, unknown> & { proyecto_id: string };

function styleWorksheet(worksheet: ExcelJS.Worksheet) {
  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D3FA9" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.height = 28;
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = { from: "A1", to: `${worksheet.getColumn(worksheet.columnCount).letter}1` };
  worksheet.eachRow((row, index) => {
    if (index > 1) row.alignment = { vertical: "top", wrapText: true };
  });
}

export async function createParticipantsWorkbook(projects: ProjectRow[], members: MemberRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExpoSemilleros CAM IA";
  workbook.created = new Date();
  const detail = workbook.addWorksheet("Participantes por proyecto");
  detail.columns = [
    { header: "Código del proyecto", key: "codigo", width: 22 },
    { header: "Nombre del proyecto", key: "proyecto", width: 38 },
    { header: "Semillero", key: "semillero", width: 24 },
    { header: "Línea temática", key: "linea", width: 28 },
    { header: "Municipio", key: "municipio", width: 20 },
    { header: "Modalidad", key: "modalidad", width: 24 },
    { header: "Estado del proyecto", key: "estado", width: 20 },
    { header: "Categoría de presentación", key: "categoria", width: 26 },
    { header: "Nombre participante", key: "nombre", width: 30 },
    { header: "Rol participante", key: "rol", width: 24 },
    { header: "Documento", key: "documento", width: 18 },
    { header: "Correo", key: "correo", width: 32 },
    { header: "Celular", key: "celular", width: 18 },
    { header: "Ficha", key: "ficha", width: 16 },
    { header: "Es menor de edad", key: "menor", width: 18 },
    { header: "Tiene autorización menor", key: "autorizacion", width: 24 },
    { header: "Fecha de registro del proyecto", key: "registro", width: 25 },
  ];
  const membersByProject = new Map<string, MemberRow[]>();
  members.forEach(member => membersByProject.set(member.proyecto_id, [...(membersByProject.get(member.proyecto_id) || []), member]));
  for (const project of projects) {
    const projectMembers = membersByProject.get(project.id) || [];
    for (const member of projectMembers) {
      detail.addRow({
        codigo: project.codigo_proyecto || "",
        proyecto: project.nombre_proyecto || "",
        semillero: project.semillero === "Otro" && project.semillero_otro ? `Otro: ${project.semillero_otro}` : project.semillero || "",
        linea: project.linea_tematica || "",
        municipio: project.municipio || "",
        modalidad: project.modalidad_participacion || "",
        estado: project.estado_proyecto || "",
        categoria: project.categoria_presentacion || "",
        nombre: member.nombre_completo || "",
        rol: member.rol_integrante || "",
        documento: member.documento || "",
        correo: member.correo || "",
        celular: member.celular || "",
        ficha: member.ficha || "",
        menor: member.es_menor_edad ? "Sí" : "No",
        autorizacion: member.tratamiento_datos_menor_path ? "Sí" : "No",
        registro: project.created_at ? new Date(String(project.created_at)) : null,
      });
    }
  }
  if (!detail.rowCount || detail.rowCount === 1) detail.addRow({ codigo: "No hay participantes registrados." });
  detail.getColumn("registro").numFmt = "dd/mm/yyyy hh:mm";
  styleWorksheet(detail);

  const summary = workbook.addWorksheet("Resumen por proyecto");
  summary.columns = [
    { header: "Código del proyecto", key: "codigo", width: 22 },
    { header: "Nombre del proyecto", key: "proyecto", width: 38 },
    { header: "Semillero", key: "semillero", width: 24 },
    { header: "Línea temática", key: "linea", width: 28 },
    { header: "Municipio", key: "municipio", width: 20 },
    { header: "Total participantes", key: "total", width: 20 },
    { header: "Autores principales", key: "autores", width: 20 },
    { header: "Aprendices", key: "aprendices", width: 16 },
    { header: "Instructores", key: "instructores", width: 16 },
    { header: "Investigadores asociados", key: "investigadores", width: 24 },
    { header: "Menores de edad", key: "menores", width: 18 },
    { header: "Fecha de registro", key: "registro", width: 22 },
  ];
  projects.forEach(project => {
    const projectMembers = membersByProject.get(project.id) || [];
    summary.addRow({
      codigo: project.codigo_proyecto || "",
      proyecto: project.nombre_proyecto || "",
      semillero: project.semillero === "Otro" && project.semillero_otro ? `Otro: ${project.semillero_otro}` : project.semillero || "",
      linea: project.linea_tematica || "",
      municipio: project.municipio || "",
      total: projectMembers.length,
      autores: projectMembers.filter(member => member.rol_integrante === "Autor principal").length,
      aprendices: projectMembers.filter(member => member.rol_integrante === "Aprendiz participante").length,
      instructores: projectMembers.filter(member => member.rol_integrante === "Instructor").length,
      investigadores: projectMembers.filter(member => member.rol_integrante === "Investigador asociado").length,
      menores: projectMembers.filter(member => Boolean(member.es_menor_edad)).length,
      registro: project.created_at ? new Date(String(project.created_at)) : null,
    });
  });
  if (!projects.length) summary.addRow({ codigo: "No hay proyectos registrados." });
  summary.getColumn("registro").numFmt = "dd/mm/yyyy hh:mm";
  styleWorksheet(summary);
  return workbook.xlsx.writeBuffer();
}

export async function createRequirementsWorkbook(projects: ProjectRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExpoSemilleros CAM IA";
  const worksheet = workbook.addWorksheet("Requerimientos logísticos");
  worksheet.columns = [
    { header: "Código del proyecto", key: "codigo", width: 22 },
    { header: "Nombre del proyecto", key: "proyecto", width: 38 },
    { header: "Semillero", key: "semillero", width: 24 },
    { header: "Línea temática", key: "linea", width: 28 },
    { header: "Municipio", key: "municipio", width: 20 },
    { header: "Punto eléctrico", key: "electricidad", width: 18 },
    { header: "Mesa o mobiliario", key: "mobiliario", width: 20 },
    { header: "Prototipo funcional", key: "prototipo", width: 20 },
    { header: "Otro elemento requerido", key: "otro", width: 24 },
    { header: "Descripción de otro elemento", key: "descripcion", width: 38 },
  ];
  projects.forEach(project => worksheet.addRow({
    codigo: project.codigo_proyecto || "", proyecto: project.nombre_proyecto || "", semillero: project.semillero || "",
    linea: project.linea_tematica || "", municipio: project.municipio || "",
    electricidad: project.requiere_conexion_electrica ? "Sí" : "No",
    mobiliario: project.requiere_mesa_mobiliario ? "Sí" : "No",
    prototipo: project.presenta_prototipo_funcional ? "Sí" : "No",
    otro: project.requiere_otro_elemento ? "Sí" : "No",
    descripcion: project.otro_elemento_descripcion || "",
  }));
  if (!projects.length) worksheet.addRow({ codigo: "No hay proyectos registrados." });
  styleWorksheet(worksheet);
  return workbook.xlsx.writeBuffer();
}
