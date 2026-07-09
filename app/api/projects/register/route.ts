import { NextResponse } from "next/server";
import { z } from "zod";

import { createProject, createProjectMembers, generateProjectCode, shouldUseMockData } from "@/lib/supabase/queries";
import { uploadProjectFile } from "@/lib/supabase/storage";
import {
  validateMinorConsentMetadata,
  validatePosterFile,
  validatePosterMetadata,
  validateProjectDocumentFile,
  validateProjectDocumentMetadata,
} from "@/lib/upload-limits";

const optionalEmail = z.union([z.string().email(), z.literal("")]).optional();
const DEFAULT_PRESENTATION_CATEGORY = "Poster" as const;

const projectTeamSchema = z.object({
  autorPrincipal: z.object({
    nombreCompleto: z.string().min(3, "El autor principal debe tener nombre completo."),
    documento: z.string().optional(),
    correo: z.string().email("El autor principal debe tener correo valido."),
    celular: z.string().min(7, "El autor principal debe tener celular."),
  }),
  aprendices: z.array(z.object({
    nombreCompleto: z.string().min(3, "Cada aprendiz debe tener nombre completo."),
    documento: z.string().min(5, "Cada aprendiz debe tener documento."),
    correo: z.string().email("Cada aprendiz debe tener correo valido."),
    celular: z.string().min(7, "Cada aprendiz debe tener celular."),
    ficha: z.string().optional(),
    esMenorEdad: z.boolean().optional().default(false),
    tratamientoDatosMenorPath: z.string().optional(),
    tratamientoDatosMenorNombre: z.string().optional(),
    tratamientoDatosMenorTipo: z.string().optional(),
    tratamientoDatosMenorSize: z.coerce.number().optional(),
  })).min(1, "Debe registrar al menos un aprendiz participante."),
  instructoresInvestigadores: z.array(z.object({
    nombreCompleto: z.string().min(3, "Cada instructor debe tener nombre completo."),
    documento: z.string().min(5, "Cada instructor debe tener documento."),
    correo: z.string().email("Cada instructor debe tener correo valido."),
    celular: z.string().min(7, "Cada instructor debe tener celular."),
    rol: z.enum(["Instructor", "Investigador asociado"]),
  })),
});

const schema = z.object({
  nombre_proyecto: z.string().min(5),
  linea_tematica: z.string().min(1),
  linea_tematica_otro: z.string().optional(),
  linea_investigacion: z.string().optional(),
  resumen_problema: z.string().min(1),
  resumen_objetivo: z.string().min(1),
  resumen_metodologia: z.string().min(1),
  resumen_resultados: z.string().min(1),
  resumen_conclusiones: z.string().min(1),
  modalidades_proyecto: z.array(z.string()).min(1),
  modalidad_otro: z.string().optional(),
  modalidad_participacion: z.string().min(1),
  estado_desarrollo_proyecto: z.string().min(1),
  productos_obtenidos: z.array(z.string()).min(1),
  productos_obtenidos_otro: z.string().optional(),
  nivel_madurez: z.string().min(1),
  semillero: z.string().min(1),
  semillero_otro: z.string().optional(),
  institucion: z.string().min(2),
  municipio: z.string().min(2),
  instructor_nombre: z.string().optional(),
  instructor_documento: z.string().optional(),
  instructor_correo: optionalEmail,
  instructor_celular: z.string().optional(),
  instructor_2_nombre: z.string().optional(),
  instructor_2_documento: z.string().optional(),
  instructor_2_correo: optionalEmail,
  instructor_2_celular: z.string().optional(),
  instructor_3_nombre: z.string().optional(),
  instructor_3_documento: z.string().optional(),
  instructor_3_correo: optionalEmail,
  instructor_3_celular: z.string().optional(),
  rol_proyecto: z.string().optional(),
  aprendiz_1_nombre: z.string().optional(),
  aprendiz_1_documento: z.string().optional(),
  aprendiz_1_correo: optionalEmail,
  aprendiz_1_celular: z.string().optional(),
  aprendiz_1_ficha: z.string().optional(),
  aprendiz_2_nombre: z.string().optional(),
  aprendiz_2_documento: z.string().optional(),
  aprendiz_2_correo: optionalEmail,
  aprendiz_2_celular: z.string().optional(),
  aprendiz_2_ficha: z.string().optional(),
  aprendiz_3_nombre: z.string().optional(),
  aprendiz_3_documento: z.string().optional(),
  aprendiz_3_correo: optionalEmail,
  aprendiz_3_celular: z.string().optional(),
  aprendiz_3_ficha: z.string().optional(),
  categoria_presentacion: z.literal(DEFAULT_PRESENTATION_CATEGORY),
  requiere_conexion_electrica: z.boolean().optional(),
  requiere_mesa_mobiliario: z.boolean().optional(),
  presenta_prototipo_funcional: z.boolean().optional(),
  requiere_otro_elemento: z.boolean().optional(),
  otro_elemento_descripcion: z.string().optional(),
  observaciones_adicionales: z.string().optional(),
  integrantes: projectTeamSchema,
}).superRefine((values, ctx) => {
  if (values.linea_tematica === "Otra" && !values.linea_tematica_otro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe indicar cual linea tematica.",
      path: ["linea_tematica_otro"],
    });
  }

  if (values.semillero === "Otro" && !values.semillero_otro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe indicar cual semillero.",
      path: ["semillero_otro"],
    });
  }

  if (values.modalidades_proyecto.includes("Otro") && !values.modalidad_otro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe indicar cual modalidad.",
      path: ["modalidad_otro"],
    });
  }

  if (values.productos_obtenidos.includes("Otro") && !values.productos_obtenidos_otro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe indicar cual producto obtenido.",
      path: ["productos_obtenidos_otro"],
    });
  }

  values.integrantes.aprendices.forEach((aprendiz, index) => {
    if (aprendiz.esMenorEdad && !aprendiz.tratamientoDatosMenorPath?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El aprendiz menor de edad debe tener autorizacion PDF cargada.",
        path: ["integrantes", "aprendices", index, "tratamientoDatosMenorPath"],
      });
    }
    if (aprendiz.esMenorEdad && aprendiz.tratamientoDatosMenorPath?.trim()) {
      const validation = validateMinorConsentMetadata({
        fileName: aprendiz.tratamientoDatosMenorNombre ?? "",
        contentType: aprendiz.tratamientoDatosMenorTipo ?? "",
        fileSize: aprendiz.tratamientoDatosMenorSize ?? 0,
      });
      if (!validation.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.error ?? "La autorizacion para menor de edad debe ser PDF.",
          path: ["integrantes", "aprendices", index, "tratamientoDatosMenorPath"],
        });
      }
    }
  });

  if (
    !values.aprendiz_1_nombre ||
    !values.aprendiz_1_documento ||
    !values.aprendiz_1_correo ||
    !values.aprendiz_1_celular
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El aprendiz investigador 1 debe tener nombre, documento, correo y telefono.",
      path: ["aprendiz_1_nombre"],
    });
  }

  ([2, 3] as const).forEach((index) => {
    const nombre = values[`aprendiz_${index}_nombre`];
    const hasAnyValue = [
      nombre,
      values[`aprendiz_${index}_documento`],
      values[`aprendiz_${index}_correo`],
      values[`aprendiz_${index}_celular`],
      values[`aprendiz_${index}_ficha`],
    ].some(Boolean);

    if (
      hasAnyValue &&
      (!nombre ||
        !values[`aprendiz_${index}_documento`] ||
        !values[`aprendiz_${index}_correo`] ||
        !values[`aprendiz_${index}_celular`])
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El aprendiz investigador ${index} debe tener nombre, documento, correo y telefono si se registra.`,
        path: [`aprendiz_${index}_nombre`],
      });
    }
  });

  ([2, 3] as const).forEach((index) => {
    const nombre = values[`instructor_${index}_nombre`];
    const hasAnyValue = [
      nombre,
      values[`instructor_${index}_documento`],
      values[`instructor_${index}_correo`],
      values[`instructor_${index}_celular`],
    ].some(Boolean);

    if (
      hasAnyValue &&
      (!nombre ||
        !values[`instructor_${index}_documento`] ||
        !values[`instructor_${index}_correo`] ||
        !values[`instructor_${index}_celular`])
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El instructor lider ${index} debe tener nombre, documento, correo y celular si se registra.`,
        path: [`instructor_${index}_nombre`],
      });
    }
  });
});

const fileMetadataSchema = z.object({
  archivo_proyecto_path: z.string().optional(),
  archivo_proyecto_nombre: z.string().optional(),
  archivo_proyecto_tipo: z.string().optional(),
  archivo_proyecto_size: z.coerce.number().optional(),
  poster_proyecto_path: z.string().optional(),
  poster_proyecto_nombre: z.string().optional(),
  poster_proyecto_tipo: z.string().optional(),
  poster_proyecto_size: z.coerce.number().optional(),
});

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function textAlias(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = stringValue(source[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function booleanAlias(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const rawValue = source[key];
    if (typeof rawValue === "boolean") {
      return rawValue;
    }

    const value = stringValue(rawValue).toLowerCase();
    if (value) {
      return ["si", "sí", "true", "1", "on"].includes(value);
    }
  }

  return false;
}

function numberAlias(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    const text = stringValue(value);
    if (text) {
      const parsed = Number(text);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }

  return 0;
}

function objectAlias(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    const text = stringValue(value);
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }
  }

  return {};
}

function arrayAlias(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as Record<string, unknown>[] : [];
}

function stringArrayAlias(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => stringValue(item))
        .filter(Boolean);
    }
    const text = stringValue(value);
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item) => stringValue(item)).filter(Boolean);
        }
      } catch {
        return text.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
  }

  return [];
}

function normalizeProjectTeam(source: Record<string, unknown>) {
  const team = objectAlias(source, ["integrantes", "equipo"]);
  const autorPrincipal = objectAlias(team, ["autorPrincipal", "autor_principal"]);
  const aprendices = arrayAlias(team, "aprendices");
  const instructoresInvestigadores = arrayAlias(team, "instructoresInvestigadores");
  const legacyInstructores = arrayAlias(team, "instructores").map((instructor) => ({
    ...instructor,
    rol: "Instructor",
  }));
  const legacyInvestigadores = arrayAlias(team, "investigadoresAsociados").map((investigador) => ({
    ...investigador,
    rol: "Investigador asociado",
  }));
  const hasExplicitCombinedTeam = Object.prototype.hasOwnProperty.call(team, "instructoresInvestigadores");
  const combinedInstructorsResearchers = hasExplicitCombinedTeam
    ? instructoresInvestigadores
    : [...legacyInstructores, ...legacyInvestigadores];

  return {
    autorPrincipal: {
      nombreCompleto: textAlias(autorPrincipal, ["nombreCompleto", "nombre_completo", "nombre"]),
      documento: textAlias(autorPrincipal, ["documento"]),
      correo: textAlias(autorPrincipal, ["correo"]),
      celular: textAlias(autorPrincipal, ["celular", "telefono"]),
    },
    aprendices: aprendices.map((aprendiz) => ({
      nombreCompleto: textAlias(aprendiz, ["nombreCompleto", "nombre_completo", "nombre"]),
      documento: textAlias(aprendiz, ["documento"]),
      correo: textAlias(aprendiz, ["correo"]),
      celular: textAlias(aprendiz, ["celular", "telefono"]),
      ficha: textAlias(aprendiz, ["ficha"]),
      esMenorEdad: booleanAlias(aprendiz, ["esMenorEdad", "es_menor_edad"]),
      tratamientoDatosMenorPath: textAlias(aprendiz, ["tratamientoDatosMenorPath", "tratamiento_datos_menor_path"]),
      tratamientoDatosMenorNombre: textAlias(aprendiz, ["tratamientoDatosMenorNombre", "tratamiento_datos_menor_nombre"]),
      tratamientoDatosMenorTipo: textAlias(aprendiz, ["tratamientoDatosMenorTipo", "tratamiento_datos_menor_tipo"]),
      tratamientoDatosMenorSize: numberAlias(aprendiz, ["tratamientoDatosMenorSize", "tratamiento_datos_menor_size"]),
    })),
    instructoresInvestigadores: combinedInstructorsResearchers.map((member) => ({
      rol: textAlias(member, ["rol", "rol_integrante"]) === "Investigador asociado"
        ? "Investigador asociado"
        : "Instructor",
      nombreCompleto: textAlias(member, ["nombreCompleto", "nombre_completo", "nombre"]),
      documento: textAlias(member, ["documento"]),
      correo: textAlias(member, ["correo"]),
      celular: textAlias(member, ["celular", "telefono"]),
    })),
  };
}

function legacyTeamFromDynamicTeam(team: z.infer<typeof projectTeamSchema>) {
  const legacy: Record<string, string> = {};
  const instructores = team.instructoresInvestigadores.filter((member) => member.rol === "Instructor");
  ([0, 1, 2] as const).forEach((index) => {
    const aprendiz = team.aprendices[index];
    const legacyIndex = index + 1;
    legacy[`aprendiz_${legacyIndex}_nombre`] = aprendiz?.nombreCompleto ?? "";
    legacy[`aprendiz_${legacyIndex}_documento`] = aprendiz?.documento ?? "";
    legacy[`aprendiz_${legacyIndex}_correo`] = aprendiz?.correo ?? "";
    legacy[`aprendiz_${legacyIndex}_celular`] = aprendiz?.celular ?? "";
    legacy[`aprendiz_${legacyIndex}_ficha`] = aprendiz?.ficha ?? "";
  });
  ([0, 1, 2] as const).forEach((index) => {
    const instructor = instructores[index];
    const prefix = index === 0 ? "instructor" : `instructor_${index + 1}`;
    legacy[`${prefix}_nombre`] = instructor?.nombreCompleto ?? "";
    legacy[`${prefix}_documento`] = instructor?.documento ?? "";
    legacy[`${prefix}_correo`] = instructor?.correo ?? "";
    legacy[`${prefix}_celular`] = instructor?.celular ?? "";
  });
  return legacy;
}

function fileAlias(formData: FormData, keys: string[]) {
  for (const key of keys) {
    const value = formData.get(key);
    if (value instanceof File && value.size > 0) {
      return value;
    }
  }

  return null;
}

function normalizeRegistrationPayload(source: Record<string, unknown>) {
  const integrantes = textAlias(source, ["integrantes"])
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const requiereOtroElemento = booleanAlias(source, [
    "requiere_otro_elemento",
    "requiereOtroElemento",
  ]);
  const normalizedTeam = normalizeProjectTeam(source);
  const parsedTeam = projectTeamSchema.safeParse(normalizedTeam);
  const legacyTeam = parsedTeam.success ? legacyTeamFromDynamicTeam(parsedTeam.data) : {};

  return {
    nombre_proyecto: textAlias(source, ["nombre_proyecto", "nombreProyecto", "titulo"]),
    linea_tematica: textAlias(source, ["linea_tematica", "lineaTematica", "area_conocimiento"]),
    linea_tematica_otro: textAlias(source, ["linea_tematica_otro", "lineaTematicaOtro"]),
    linea_investigacion: textAlias(source, ["linea_investigacion", "lineaInvestigacion"]),
    resumen_problema: textAlias(source, ["resumen_problema", "resumenProblema"]),
    resumen_objetivo: textAlias(source, ["resumen_objetivo", "resumenObjetivo"]),
    resumen_metodologia: textAlias(source, ["resumen_metodologia", "resumenMetodologia"]),
    resumen_resultados: textAlias(source, ["resumen_resultados", "resumenResultados"]),
    resumen_conclusiones: textAlias(source, ["resumen_conclusiones", "resumenConclusiones"]),
    modalidades_proyecto: stringArrayAlias(source, ["modalidades_proyecto", "modalidadesProyecto"]),
    modalidad_otro: textAlias(source, ["modalidad_otro", "modalidadOtro"]),
    modalidad_participacion: textAlias(source, [
      "modalidad_participacion",
      "modalidadParticipacion",
    ]),
    estado_desarrollo_proyecto: textAlias(source, ["estado_desarrollo_proyecto", "estadoDesarrolloProyecto"]),
    productos_obtenidos: stringArrayAlias(source, ["productos_obtenidos", "productosObtenidos"]),
    productos_obtenidos_otro: textAlias(source, ["productos_obtenidos_otro", "productosObtenidosOtro"]),
    nivel_madurez: textAlias(source, ["nivel_madurez", "nivelMadurez"]),
    semillero: textAlias(source, ["semillero"]),
    semillero_otro: textAlias(source, ["semillero_otro", "semilleroOtro"]),
    institucion: textAlias(source, ["institucion"]),
    municipio: textAlias(source, ["municipio"]),
    instructor_nombre: legacyTeam.instructor_nombre || textAlias(source, ["instructor_nombre", "instructorNombre"]),
    instructor_documento: legacyTeam.instructor_documento || textAlias(source, ["instructor_documento", "instructorDocumento"]),
    instructor_correo: legacyTeam.instructor_correo || textAlias(source, ["instructor_correo", "instructorCorreo"]),
    instructor_celular: legacyTeam.instructor_celular || textAlias(source, ["instructor_celular", "instructorCelular"]),
    instructor_2_nombre: legacyTeam.instructor_2_nombre || textAlias(source, ["instructor_2_nombre", "instructor2Nombre"]),
    instructor_2_documento: legacyTeam.instructor_2_documento || textAlias(source, ["instructor_2_documento", "instructor2Documento"]),
    instructor_2_correo: legacyTeam.instructor_2_correo || textAlias(source, ["instructor_2_correo", "instructor2Correo"]),
    instructor_2_celular: legacyTeam.instructor_2_celular || textAlias(source, ["instructor_2_celular", "instructor2Celular"]),
    instructor_3_nombre: legacyTeam.instructor_3_nombre || textAlias(source, ["instructor_3_nombre", "instructor3Nombre"]),
    instructor_3_documento: legacyTeam.instructor_3_documento || textAlias(source, ["instructor_3_documento", "instructor3Documento"]),
    instructor_3_correo: legacyTeam.instructor_3_correo || textAlias(source, ["instructor_3_correo", "instructor3Correo"]),
    instructor_3_celular: legacyTeam.instructor_3_celular || textAlias(source, ["instructor_3_celular", "instructor3Celular"]),
    rol_proyecto: textAlias(source, ["rol_proyecto", "rolProyecto"]),
    aprendiz_1_nombre: legacyTeam.aprendiz_1_nombre || textAlias(source, ["aprendiz_1_nombre", "aprendiz1Nombre"]) || integrantes[0],
    aprendiz_1_documento: legacyTeam.aprendiz_1_documento || textAlias(source, ["aprendiz_1_documento", "aprendiz1Documento"]),
    aprendiz_1_correo: legacyTeam.aprendiz_1_correo || textAlias(source, ["aprendiz_1_correo", "aprendiz1Correo"]),
    aprendiz_1_celular: legacyTeam.aprendiz_1_celular || textAlias(source, ["aprendiz_1_celular", "aprendiz1Celular"]),
    aprendiz_1_ficha: legacyTeam.aprendiz_1_ficha || textAlias(source, ["aprendiz_1_ficha", "aprendiz1Ficha"]),
    aprendiz_2_nombre: legacyTeam.aprendiz_2_nombre || textAlias(source, ["aprendiz_2_nombre", "aprendiz2Nombre"]) || integrantes[1],
    aprendiz_2_documento: legacyTeam.aprendiz_2_documento || textAlias(source, ["aprendiz_2_documento", "aprendiz2Documento"]),
    aprendiz_2_correo: legacyTeam.aprendiz_2_correo || textAlias(source, ["aprendiz_2_correo", "aprendiz2Correo"]),
    aprendiz_2_celular: legacyTeam.aprendiz_2_celular || textAlias(source, ["aprendiz_2_celular", "aprendiz2Celular"]),
    aprendiz_2_ficha: legacyTeam.aprendiz_2_ficha || textAlias(source, ["aprendiz_2_ficha", "aprendiz2Ficha"]),
    aprendiz_3_nombre: legacyTeam.aprendiz_3_nombre || textAlias(source, ["aprendiz_3_nombre", "aprendiz3Nombre"]) || integrantes[2],
    aprendiz_3_documento: legacyTeam.aprendiz_3_documento || textAlias(source, ["aprendiz_3_documento", "aprendiz3Documento"]),
    aprendiz_3_correo: legacyTeam.aprendiz_3_correo || textAlias(source, ["aprendiz_3_correo", "aprendiz3Correo"]),
    aprendiz_3_celular: legacyTeam.aprendiz_3_celular || textAlias(source, ["aprendiz_3_celular", "aprendiz3Celular"]),
    aprendiz_3_ficha: legacyTeam.aprendiz_3_ficha || textAlias(source, ["aprendiz_3_ficha", "aprendiz3Ficha"]),
    categoria_presentacion: DEFAULT_PRESENTATION_CATEGORY,
    requiere_conexion_electrica: booleanAlias(source, [
      "requiere_conexion_electrica",
      "requiereConexionElectrica",
    ]),
    requiere_mesa_mobiliario: booleanAlias(source, [
      "requiere_mesa_mobiliario",
      "requiereMesaMobiliario",
    ]),
    presenta_prototipo_funcional: booleanAlias(source, [
      "presenta_prototipo_funcional",
      "presentaPrototipoFuncional",
    ]),
    requiere_otro_elemento: requiereOtroElemento,
    otro_elemento_descripcion: requiereOtroElemento
      ? textAlias(source, ["otro_elemento_descripcion", "otroElementoDescripcion"])
      : "",
    observaciones_adicionales: textAlias(source, [
      "observaciones_adicionales",
      "observacionesAdicionales",
      "resumen",
    ]),
    integrantes: normalizedTeam,
  };
}

function normalizeFileMetadata(source: Record<string, unknown>) {
  return fileMetadataSchema.parse({
    archivo_proyecto_path: textAlias(source, ["archivo_proyecto_path", "archivoProyectoPath"]),
    archivo_proyecto_nombre: textAlias(source, ["archivo_proyecto_nombre", "archivoProyectoNombre"]),
    archivo_proyecto_tipo: textAlias(source, ["archivo_proyecto_tipo", "archivoProyectoTipo"]),
    archivo_proyecto_size: numberAlias(source, ["archivo_proyecto_size", "archivoProyectoSize"]),
    poster_proyecto_path: textAlias(source, ["poster_proyecto_path", "posterProyectoPath"]),
    poster_proyecto_nombre: textAlias(source, ["poster_proyecto_nombre", "posterProyectoNombre"]),
    poster_proyecto_tipo: textAlias(source, ["poster_proyecto_tipo", "posterProyectoTipo"]),
    poster_proyecto_size: numberAlias(source, ["poster_proyecto_size", "posterProyectoSize"]),
  });
}

function validateRegisteredFileMetadata(fileMetadata: z.infer<typeof fileMetadataSchema>) {
  console.log("[projects/register] validando archivo principal", {
    path: fileMetadata.archivo_proyecto_path,
    fileName: fileMetadata.archivo_proyecto_nombre,
    contentType: fileMetadata.archivo_proyecto_tipo,
    fileSize: fileMetadata.archivo_proyecto_size,
  });

  if (!fileMetadata.archivo_proyecto_path) {
    return null;
  }
  if (!fileMetadata.archivo_proyecto_nombre) {
    return "El nombre del archivo del proyecto es obligatorio.";
  }

  const documentValidation = validateProjectDocumentMetadata({
    fileName: fileMetadata.archivo_proyecto_nombre,
    contentType: fileMetadata.archivo_proyecto_tipo ?? "",
    fileSize: fileMetadata.archivo_proyecto_size ?? 0,
  });

  console.log("[projects/register] validacion de archivo principal", {
    fileName: fileMetadata.archivo_proyecto_nombre,
    contentType: fileMetadata.archivo_proyecto_tipo,
    fileSize: fileMetadata.archivo_proyecto_size,
    valid: documentValidation.valid,
    reason: documentValidation.reason,
  });

  if (!documentValidation.valid) {
    console.warn("[projects/register] error de validacion de archivo principal", {
      path: fileMetadata.archivo_proyecto_path,
      fileName: fileMetadata.archivo_proyecto_nombre,
      contentType: fileMetadata.archivo_proyecto_tipo,
      fileSize: fileMetadata.archivo_proyecto_size,
      reason: documentValidation.reason,
      error: documentValidation.error,
    });
    return documentValidation.error ?? "El documento del proyecto no cumple los requisitos.";
  }

  if (fileMetadata.poster_proyecto_path) {
    console.log("[projects/register] validando poster", {
      path: fileMetadata.poster_proyecto_path,
      fileName: fileMetadata.poster_proyecto_nombre,
      contentType: fileMetadata.poster_proyecto_tipo,
      fileSize: fileMetadata.poster_proyecto_size,
    });

    if (!fileMetadata.poster_proyecto_nombre) {
      return "El nombre del poster es obligatorio.";
    }

    const posterValidation = validatePosterMetadata({
      fileName: fileMetadata.poster_proyecto_nombre ?? "",
      contentType: fileMetadata.poster_proyecto_tipo ?? "",
      fileSize: fileMetadata.poster_proyecto_size ?? 0,
    });

    console.log("[projects/register] validacion de poster", {
      fileName: fileMetadata.poster_proyecto_nombre,
      contentType: fileMetadata.poster_proyecto_tipo,
      fileSize: fileMetadata.poster_proyecto_size,
      valid: posterValidation.valid,
      reason: posterValidation.reason,
    });

    if (!posterValidation.valid) {
      console.warn("[projects/register] error de validacion de poster", {
        path: fileMetadata.poster_proyecto_path,
        fileName: fileMetadata.poster_proyecto_nombre,
        contentType: fileMetadata.poster_proyecto_tipo,
        fileSize: fileMetadata.poster_proyecto_size,
        reason: posterValidation.reason,
        error: posterValidation.error,
      });
      return posterValidation.error ?? "El poster no cumple los requisitos.";
    }
  } else {
    console.log("[projects/register] poster no enviado; validacion omitida");
  }

  return null;
}

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(([, value]) => typeof value === "string"),
  ) as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const useMockData = shouldUseMockData();
    const contentType = request.headers.get("content-type") ?? "";
    console.log("[projects/register] USE_MOCK_DATA actual", process.env.USE_MOCK_DATA);
    console.log("[projects/register] modo", useMockData ? "mock" : "supabase");
    console.log("[projects/register] content-type recibido", contentType);

    const isJson = contentType.includes("application/json");
    const jsonPayload = isJson ? ((await request.json()) as Record<string, unknown>) : null;
    const formData = isJson ? null : await request.formData();
    const source = jsonPayload ?? formDataToRecord(formData as FormData);
    const normalizedPayload = normalizeRegistrationPayload(source);
    const fileMetadata = normalizeFileMetadata(source);
    console.log("[projects/register] payload recibido normalizado", normalizedPayload);
    console.log("[projects/register] metadatos de archivos recibidos", fileMetadata);

    const values = schema.parse(normalizedPayload);
    const file = formData ? fileAlias(formData, ["archivo_proyecto", "archivoProyecto"]) : null;
    const poster = formData ? fileAlias(formData, ["poster_proyecto", "posterProyecto"]) : null;
    console.log("[projects/register] archivo completo recibido por multipart", file ? {
      name: file.name,
      type: file.type,
      size: file.size,
    } : null);
    console.log("[projects/register] poster recibido por multipart", poster ? {
      name: poster.name,
      type: poster.type,
      size: poster.size,
    } : null);

    if (file) {
      const fileValidation = validateProjectDocumentFile(file);
      console.log("[projects/register] validacion de archivo principal multipart", {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        valid: fileValidation.valid,
        reason: fileValidation.reason,
      });
      if (!fileValidation.valid) {
        console.warn("[projects/register] rechazo de archivo principal multipart", {
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          reason: fileValidation.reason,
        });
        return NextResponse.json(
          { error: fileValidation.error ?? "El documento del proyecto no cumple los requisitos." },
          { status: 400 },
        );
      }
    } else {
      const metadataError = validateRegisteredFileMetadata(fileMetadata);
      if (metadataError) {
        console.warn("[projects/register] rechazo de metadatos de archivo principal", {
          fileMetadata,
          error: metadataError,
        });
        return NextResponse.json({ error: metadataError }, { status: 400 });
      }
    }

    if (poster) {
      const posterValidation = validatePosterFile(poster);
      console.log("[projects/register] validacion de poster multipart", {
        fileName: poster.name,
        contentType: poster.type,
        fileSize: poster.size,
        valid: posterValidation.valid,
        reason: posterValidation.reason,
      });
      if (!posterValidation.valid) {
        console.warn("[projects/register] rechazo de poster multipart", {
          fileName: poster.name,
          contentType: poster.type,
          fileSize: poster.size,
          reason: posterValidation.reason,
        });
        return NextResponse.json(
          { error: posterValidation.error ?? "El poster no cumple los requisitos." },
          { status: 400 },
        );
      }
    }

    if (useMockData) {
      const mockProject = {
        codigo_proyecto: "EXPOCAM-2026-0001",
        ...values,
        ...fileMetadata,
        estado_proyecto: "Registrado",
        estado_evaluacion_humana: "Pendiente",
        estado_analisis_ia: "Pendiente",
        estado_lectura_archivo: "Pendiente",
      };
      console.log("[projects/register] payload mock", mockProject);
      return NextResponse.json({ project: mockProject }, { status: 201 });
    }

    const codigoProyecto = await generateProjectCode();
    let archivoProyectoPath = fileMetadata.archivo_proyecto_path ?? "";
    let posterProyectoPath = fileMetadata.poster_proyecto_path ?? "";
    let archivoProyectoNombre = fileMetadata.archivo_proyecto_nombre ?? "";
    let archivoProyectoTipo = fileMetadata.archivo_proyecto_tipo ?? "";
    let archivoProyectoSize = fileMetadata.archivo_proyecto_size ?? 0;
    let posterProyectoNombre = fileMetadata.poster_proyecto_nombre ?? "";
    let posterProyectoTipo = fileMetadata.poster_proyecto_tipo ?? "";
    let posterProyectoSize = fileMetadata.poster_proyecto_size ?? 0;

    if (file) {
      archivoProyectoPath = await uploadProjectFile(file, codigoProyecto, "archivo");
      archivoProyectoNombre = file.name;
      archivoProyectoTipo = file.type || "application/octet-stream";
      archivoProyectoSize = file.size;
    }
    if (poster) {
      posterProyectoPath = await uploadProjectFile(poster, codigoProyecto, "poster");
      posterProyectoNombre = poster.name;
      posterProyectoTipo = poster.type || "application/octet-stream";
      posterProyectoSize = poster.size;
    }
    console.log("[projects/register] rutas de archivos para insertar", {
      archivoProyectoPath,
      posterProyectoPath,
    });

    const projectPayload = {
      codigo_proyecto: codigoProyecto,
      ...values,
      archivo_proyecto_path: archivoProyectoPath,
      archivo_proyecto_nombre: archivoProyectoNombre,
      archivo_proyecto_tipo: archivoProyectoPath ? archivoProyectoTipo || "application/octet-stream" : "",
      archivo_proyecto_size: archivoProyectoSize,
      poster_proyecto_path: posterProyectoPath,
      poster_proyecto_nombre: posterProyectoNombre,
      poster_proyecto_tipo: posterProyectoTipo,
      poster_proyecto_size: posterProyectoSize,
    };
    const finalMetadataError = validateRegisteredFileMetadata(projectPayload);
    if (finalMetadataError) {
      console.warn("[projects/register] error de validacion en payload final", {
        error: finalMetadataError,
        archivo_proyecto_path: projectPayload.archivo_proyecto_path,
        archivo_proyecto_nombre: projectPayload.archivo_proyecto_nombre,
        archivo_proyecto_tipo: projectPayload.archivo_proyecto_tipo,
        archivo_proyecto_size: projectPayload.archivo_proyecto_size,
        poster_proyecto_path: projectPayload.poster_proyecto_path,
        poster_proyecto_nombre: projectPayload.poster_proyecto_nombre,
        poster_proyecto_tipo: projectPayload.poster_proyecto_tipo,
        poster_proyecto_size: projectPayload.poster_proyecto_size,
      });
      return NextResponse.json({ error: finalMetadataError }, { status: 400 });
    }

    console.log("[projects/register] payload final aceptado", projectPayload);
    const project = await createProject(projectPayload);
    if (!project.id) {
      throw new Error("El proyecto fue creado, pero no se recibio su identificador para guardar integrantes.");
    }
    try {
      await createProjectMembers(project.id, values.integrantes);
    } catch (error) {
      console.error("[projects/register] error guardando integrantes del proyecto", error);
      throw new Error("El proyecto se registro, pero fallo el guardado del equipo del proyecto. Revise la tabla proyecto_integrantes.");
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[projects/register] error exacto en registro de proyecto", error);
    const message = error instanceof Error ? error.message : "No se pudo registrar el proyecto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
