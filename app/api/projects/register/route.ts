import { NextResponse } from "next/server";
import { z } from "zod";

import { createProject, generateProjectCode, shouldUseMockData } from "@/lib/supabase/queries";
import { uploadProjectFile } from "@/lib/supabase/storage";

const optionalEmail = z.union([z.string().email(), z.literal("")]).optional();

const schema = z.object({
  nombre_proyecto: z.string().min(5),
  linea_tematica: z.string().min(1),
  modalidad_participacion: z.string().min(1),
  semillero: z.string().min(1),
  institucion: z.string().min(2),
  municipio: z.string().min(2),
  instructor_nombre: z.string().min(3),
  instructor_documento: z.string().min(5),
  instructor_correo: z.string().email(),
  instructor_celular: z.string().min(7),
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
  categoria_presentacion: z.string().min(1),
  requiere_conexion_electrica: z.boolean().optional(),
  requiere_mesa_mobiliario: z.boolean().optional(),
  presenta_prototipo_funcional: z.boolean().optional(),
  requiere_otro_elemento: z.boolean().optional(),
  otro_elemento_descripcion: z.string().optional(),
  observaciones_adicionales: z.string().optional(),
}).superRefine((values, ctx) => {
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

  return {
    nombre_proyecto: textAlias(source, ["nombre_proyecto", "nombreProyecto", "titulo"]),
    linea_tematica: textAlias(source, ["linea_tematica", "lineaTematica", "area_conocimiento"]),
    modalidad_participacion: textAlias(source, [
      "modalidad_participacion",
      "modalidadParticipacion",
    ]),
    semillero: textAlias(source, ["semillero"]),
    institucion: textAlias(source, ["institucion"]),
    municipio: textAlias(source, ["municipio"]),
    instructor_nombre: textAlias(source, ["instructor_nombre", "instructorNombre"]),
    instructor_documento: textAlias(source, ["instructor_documento", "instructorDocumento"]),
    instructor_correo: textAlias(source, ["instructor_correo", "instructorCorreo"]),
    instructor_celular: textAlias(source, ["instructor_celular", "instructorCelular"]),
    instructor_2_nombre: textAlias(source, ["instructor_2_nombre", "instructor2Nombre"]),
    instructor_2_documento: textAlias(source, ["instructor_2_documento", "instructor2Documento"]),
    instructor_2_correo: textAlias(source, ["instructor_2_correo", "instructor2Correo"]),
    instructor_2_celular: textAlias(source, ["instructor_2_celular", "instructor2Celular"]),
    instructor_3_nombre: textAlias(source, ["instructor_3_nombre", "instructor3Nombre"]),
    instructor_3_documento: textAlias(source, ["instructor_3_documento", "instructor3Documento"]),
    instructor_3_correo: textAlias(source, ["instructor_3_correo", "instructor3Correo"]),
    instructor_3_celular: textAlias(source, ["instructor_3_celular", "instructor3Celular"]),
    rol_proyecto: textAlias(source, ["rol_proyecto", "rolProyecto"]),
    aprendiz_1_nombre: textAlias(source, ["aprendiz_1_nombre", "aprendiz1Nombre"]) || integrantes[0],
    aprendiz_1_documento: textAlias(source, ["aprendiz_1_documento", "aprendiz1Documento"]),
    aprendiz_1_correo: textAlias(source, ["aprendiz_1_correo", "aprendiz1Correo"]),
    aprendiz_1_celular: textAlias(source, ["aprendiz_1_celular", "aprendiz1Celular"]),
    aprendiz_1_ficha: textAlias(source, ["aprendiz_1_ficha", "aprendiz1Ficha"]),
    aprendiz_2_nombre: textAlias(source, ["aprendiz_2_nombre", "aprendiz2Nombre"]) || integrantes[1],
    aprendiz_2_documento: textAlias(source, ["aprendiz_2_documento", "aprendiz2Documento"]),
    aprendiz_2_correo: textAlias(source, ["aprendiz_2_correo", "aprendiz2Correo"]),
    aprendiz_2_celular: textAlias(source, ["aprendiz_2_celular", "aprendiz2Celular"]),
    aprendiz_2_ficha: textAlias(source, ["aprendiz_2_ficha", "aprendiz2Ficha"]),
    aprendiz_3_nombre: textAlias(source, ["aprendiz_3_nombre", "aprendiz3Nombre"]) || integrantes[2],
    aprendiz_3_documento: textAlias(source, ["aprendiz_3_documento", "aprendiz3Documento"]),
    aprendiz_3_correo: textAlias(source, ["aprendiz_3_correo", "aprendiz3Correo"]),
    aprendiz_3_celular: textAlias(source, ["aprendiz_3_celular", "aprendiz3Celular"]),
    aprendiz_3_ficha: textAlias(source, ["aprendiz_3_ficha", "aprendiz3Ficha"]),
    categoria_presentacion: textAlias(source, [
      "categoria_presentacion",
      "categoriaPresentacion",
    ]),
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

    if (!archivoProyectoPath) {
      return NextResponse.json(
        { error: "El archivo del proyecto es obligatorio." },
        { status: 400 },
      );
    }

    const projectPayload = {
      codigo_proyecto: codigoProyecto,
      ...values,
      archivo_proyecto_path: archivoProyectoPath,
      archivo_proyecto_nombre: archivoProyectoNombre,
      archivo_proyecto_tipo: archivoProyectoTipo || "application/octet-stream",
      archivo_proyecto_size: archivoProyectoSize,
      poster_proyecto_path: posterProyectoPath,
      poster_proyecto_nombre: posterProyectoNombre,
      poster_proyecto_tipo: posterProyectoTipo,
      poster_proyecto_size: posterProyectoSize,
    };
    console.log("[projects/register] payload final insertado en Supabase", projectPayload);
    const project = await createProject(projectPayload);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[projects/register] error exacto en registro de proyecto", error);
    const message = error instanceof Error ? error.message : "No se pudo registrar el proyecto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
