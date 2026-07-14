import type { Project, ProjectMember } from "@/types/project";

export const EDIT_ACCESS_ERROR = "No encontramos un proyecto con ese código y documento registrado.";
export const EDIT_CLOSED_ERROR = "La edición de inscripciones ya no está disponible porque inició el proceso de asignación y evaluación de proyectos.";

export function normalizeDocument(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s.,-]/g, "");
}

export function documentBelongsToProject(project: Project, members: ProjectMember[], document: unknown) {
  const requested = normalizeDocument(document);
  if (!requested) return false;

  const memberMatch = members.some((member) => normalizeDocument(member.documento) === requested);
  if (memberMatch) return true;

  const legacyFields: Array<keyof Project> = [
    "instructor_documento", "instructor_2_documento", "instructor_3_documento",
    "aprendiz_1_documento", "aprendiz_2_documento", "aprendiz_3_documento",
  ];
  return legacyFields.some((field) => normalizeDocument(project[field]) === requested);
}

export function editableProject(project: Project, members: ProjectMember[], hasEvaluations: boolean) {
  const effectiveMembers = members.length ? members : legacyMembers(project);
  return {
    id: project.id,
    codigo_proyecto: project.codigo_proyecto ?? project.codigo,
    nombre_proyecto: project.nombre_proyecto ?? project.titulo,
    linea_tematica: project.linea_tematica,
    linea_tematica_otro: project.linea_tematica_otro ?? "",
    semillero: project.semillero,
    semillero_otro: project.semillero_otro ?? "",
    institucion: project.institucion,
    municipio: project.municipio,
    resumen_problema: project.resumen_problema ?? "",
    resumen_objetivo: project.resumen_objetivo ?? "",
    resumen_metodologia: project.resumen_metodologia ?? "",
    resumen_resultados: project.resumen_resultados ?? "",
    resumen_conclusiones: project.resumen_conclusiones ?? "",
    modalidades_proyecto: project.modalidades_proyecto ?? [],
    modalidad_otro: project.modalidad_otro ?? "",
    modalidad_participacion: project.modalidad_participacion ?? "",
    estado_desarrollo_proyecto: project.estado_desarrollo_proyecto ?? "",
    productos_obtenidos: project.productos_obtenidos ?? [],
    productos_obtenidos_otro: project.productos_obtenidos_otro ?? "",
    nivel_madurez: project.nivel_madurez ?? "",
    poster: project.poster_proyecto_path ? {
      existe: true,
      nombre: project.poster_proyecto_nombre ?? "Póster cargado",
      tipo: project.poster_proyecto_tipo ?? "",
      size: project.poster_proyecto_size ?? 0,
    } : null,
    requiere_conexion_electrica: Boolean(project.requiere_conexion_electrica),
    requiere_mesa_mobiliario: Boolean(project.requiere_mesa_mobiliario),
    presenta_prototipo_funcional: Boolean(project.presenta_prototipo_funcional),
    requiere_otro_elemento: Boolean(project.requiere_otro_elemento),
    otro_elemento_descripcion: project.otro_elemento_descripcion ?? "",
    has_evaluations: hasEvaluations,
    integrantes: effectiveMembers.map((member) => ({
      rol_integrante: member.rol_integrante,
      nombre_completo: member.nombre_completo,
      documento: member.documento ?? "",
      correo: member.correo ?? "",
      celular: member.celular ?? "",
      ficha: member.ficha ?? "",
      es_menor_edad: Boolean(member.es_menor_edad),
      autorizacion_existente: Boolean(member.tratamiento_datos_menor_path),
      tratamiento_datos_menor_path: member.tratamiento_datos_menor_path ? "__existing__" : "",
      tratamiento_datos_menor_nombre: member.tratamiento_datos_menor_nombre ?? "",
      tratamiento_datos_menor_tipo: member.tratamiento_datos_menor_tipo ?? "",
      tratamiento_datos_menor_size: member.tratamiento_datos_menor_size ?? 0,
    })),
  };
}

function legacyMembers(project: Project): ProjectMember[] {
  const learners = [1, 2, 3].map((number) => ({
    rol_integrante: "Aprendiz participante" as const,
    nombre_completo: String(project[`aprendiz_${number}_nombre` as keyof Project] ?? ""),
    documento: String(project[`aprendiz_${number}_documento` as keyof Project] ?? ""),
    correo: String(project[`aprendiz_${number}_correo` as keyof Project] ?? ""),
    celular: String(project[`aprendiz_${number}_celular` as keyof Project] ?? ""),
    ficha: String(project[`aprendiz_${number}_ficha` as keyof Project] ?? ""),
    orden: number,
  })).filter((member) => member.nombre_completo);
  const instructors = [1, 2, 3].map((number) => {
    const prefix = number === 1 ? "instructor" : `instructor_${number}`;
    return { rol_integrante: "Instructor" as const, nombre_completo: String(project[`${prefix}_nombre` as keyof Project] ?? ""), documento: String(project[`${prefix}_documento` as keyof Project] ?? ""), correo: String(project[`${prefix}_correo` as keyof Project] ?? ""), celular: String(project[`${prefix}_celular` as keyof Project] ?? ""), ficha: "", orden: number };
  }).filter((member) => member.nombre_completo);
  // Los registros antiguos no siempre distinguían autor principal; el primer aprendiz
  // permite precargar el formulario sin inventar datos personales nuevos.
  const first = learners[0];
  const author: ProjectMember[] = first ? [{ ...first, rol_integrante: "Autor principal", orden: 1 }] : [];
  return [...author, ...learners, ...instructors];
}
