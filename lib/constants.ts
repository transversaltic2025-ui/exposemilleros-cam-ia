export const SYSTEM_NAME = "ExpoSemilleros CAM IA" as const;
export const SYSTEM_SHORT_NAME = "ExpoSemilleros IA" as const;

export const LINEAS_TEMATICAS = [
  "Agroindustria",
  "Agricultura",
  "Pecuaria",
  "Ambiental",
  "Biotecnología",
  "TIC",
  "Automatización",
  "Energías renovables",
  "Economía circular",
  "Emprendimiento",
  "Otra",
] as const;

export const LINEAS_INVESTIGACION = [
  "Extensión agropecuaria, desarrollo social y pedagógico",
  "Innovación agroindustrial sostenible",
] as const;

export const MODALIDADES_PARTICIPACION = [
  "Investigación aplicada",
  "Innovación",
  "Emprendimiento",
  "Desarrollo tecnológico",
  "Otro",
] as const;

export const ESTADOS_DESARROLLO_PROYECTO = [
  "Formulado",
  "En ejecución",
  "Finalizado",
  "Transferencia tecnológica",
] as const;

export const PRODUCTOS_OBTENIDOS = [
  "Prototipo",
  "Software",
  "Bioproducto",
  "Artículo",
  "Ponencia",
  "Poster",
  "Patente",
  "Diseño industrial",
  "Marca",
  "Otro",
] as const;

export const NIVELES_MADUREZ = [
  "Idea",
  "Prototipo funcional",
  "Validado",
  "Transferencia tecnológica",
  "Comercializado",
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
  "Otro",
] as const;

// "Poster" se conserva como valor interno; la interfaz lo presenta como "Póster".
export const CATEGORIAS_PRESENTACION = ["Poster"] as const;

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
export type EstadoDesarrolloProyecto = (typeof ESTADOS_DESARROLLO_PROYECTO)[number];
export type ProductoObtenido = (typeof PRODUCTOS_OBTENIDOS)[number];
export type NivelMadurez = (typeof NIVELES_MADUREZ)[number];
export type Semillero = (typeof SEMILLEROS)[number];
export type CategoriaPresentacion = (typeof CATEGORIAS_PRESENTACION)[number];
export type OpcionSiNo = (typeof OPCIONES_SI_NO)[number];
export type EstadoProyecto = (typeof ESTADOS_PROYECTO)[number];
export type EstadoEvaluacionHumana = (typeof ESTADOS_EVALUACION_HUMANA)[number];
export type EstadoAnalisisIA = (typeof ESTADOS_ANALISIS_IA)[number];
export type EstadoAsignacion = (typeof ESTADOS_ASIGNACION)[number];
