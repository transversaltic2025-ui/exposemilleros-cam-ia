export const SYSTEM_NAME = "ExpoSemilleros CAM IA" as const;
export const SYSTEM_SHORT_NAME = "ExpoSemilleros IA" as const;

export const LINEAS_TEMATICAS = [
  "Pecuaria",
  "Agrícola",
  "Apícola",
  "Ambiental",
  "Tecnología e innovación",
  "Administrativa",
  "Agroindustria",
] as const;

export const LINEAS_INVESTIGACION = [
  "Extensión agropecuaria, desarrollo social y pedagógico",
  "Innovación agroindustrial sostenible",
] as const;

export const MODALIDADES_PARTICIPACION = [
  "Propuesta de investigación",
  "Proyecto en ejecución",
  "Proyecto terminado",
] as const;

export const SEMILLEROS = [
  "Cienciatec",
  "AgroadminLab",
  "Aspillanos",
  "Tecnobioma",
  "Administrativo Naranjos",
  "Nido",
  "Pecuario",
  "Agrícola",
  "Ambiental",
  "Napecam",
  "Sibari",
] as const;

export const CATEGORIAS_PRESENTACION = [
  "Poster",
] as const;

export const OPCIONES_SI_NO = ["Sí", "No"] as const;

export const ESTADOS_PROYECTO = [
  "Registrado",
  "Asignado",
  "En evaluación",
  "Evaluado",
  "Cerrado",
  "Devuelto",
] as const;

export const ESTADOS_EVALUACION_HUMANA = [
  "Pendiente",
  "En proceso",
  "Completada",
  "Bloqueada",
] as const;

export const ESTADOS_ANALISIS_IA = [
  "Pendiente",
  "Procesando",
  "Completado",
  "Error",
  "No disponible",
] as const;

export const ESTADOS_ASIGNACION = [
  "Pendiente",
  "En proceso",
  "Completada",
  "Bloqueada",
  "Cancelada",
] as const;

export type LineaTematica = (typeof LINEAS_TEMATICAS)[number];
export type LineaInvestigacion = (typeof LINEAS_INVESTIGACION)[number];
export type ModalidadParticipacion = (typeof MODALIDADES_PARTICIPACION)[number];
export type Semillero = (typeof SEMILLEROS)[number];
export type CategoriaPresentacion = (typeof CATEGORIAS_PRESENTACION)[number];
export type OpcionSiNo = (typeof OPCIONES_SI_NO)[number];
export type EstadoProyecto = (typeof ESTADOS_PROYECTO)[number];
export type EstadoEvaluacionHumana = (typeof ESTADOS_EVALUACION_HUMANA)[number];
export type EstadoAnalisisIA = (typeof ESTADOS_ANALISIS_IA)[number];
export type EstadoAsignacion = (typeof ESTADOS_ASIGNACION)[number];
