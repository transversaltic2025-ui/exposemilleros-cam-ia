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

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function textAlias(formData: FormData, keys: string[]) {
  for (const key of keys) {
    const value = text(formData, key);
    if (value) {
      return value;
    }
  }

  return "";
}

function booleanAlias(formData: FormData, keys: string[]) {
  const value = textAlias(formData, keys).toLowerCase();
  return ["si", "sí", "true", "1", "on"].includes(value);
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

function normalizeRegistrationPayload(formData: FormData) {
  const integrantes = textAlias(formData, ["integrantes"])
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const requiereOtroElemento = booleanAlias(formData, [
    "requiere_otro_elemento",
    "requiereOtroElemento",
  ]);

  return {
    nombre_proyecto: textAlias(formData, ["nombre_proyecto", "nombreProyecto", "titulo"]),
    linea_tematica: textAlias(formData, ["linea_tematica", "lineaTematica", "area_conocimiento"]),
    modalidad_participacion: textAlias(formData, [
      "modalidad_participacion",
      "modalidadParticipacion",
    ]),
    semillero: text(formData, "semillero"),
    institucion: text(formData, "institucion"),
    municipio: text(formData, "municipio"),
    instructor_nombre: textAlias(formData, ["instructor_nombre", "instructorNombre"]),
    instructor_documento: textAlias(formData, ["instructor_documento", "instructorDocumento"]),
    instructor_correo: textAlias(formData, ["instructor_correo", "instructorCorreo"]),
    instructor_celular: textAlias(formData, ["instructor_celular", "instructorCelular"]),
    instructor_2_nombre: textAlias(formData, ["instructor_2_nombre", "instructor2Nombre"]),
    instructor_2_documento: textAlias(formData, ["instructor_2_documento", "instructor2Documento"]),
    instructor_2_correo: textAlias(formData, ["instructor_2_correo", "instructor2Correo"]),
    instructor_2_celular: textAlias(formData, ["instructor_2_celular", "instructor2Celular"]),
    instructor_3_nombre: textAlias(formData, ["instructor_3_nombre", "instructor3Nombre"]),
    instructor_3_documento: textAlias(formData, ["instructor_3_documento", "instructor3Documento"]),
    instructor_3_correo: textAlias(formData, ["instructor_3_correo", "instructor3Correo"]),
    instructor_3_celular: textAlias(formData, ["instructor_3_celular", "instructor3Celular"]),
    rol_proyecto: textAlias(formData, ["rol_proyecto", "rolProyecto"]),
    aprendiz_1_nombre: textAlias(formData, ["aprendiz_1_nombre", "aprendiz1Nombre"]) || integrantes[0],
    aprendiz_1_documento: textAlias(formData, ["aprendiz_1_documento", "aprendiz1Documento"]),
    aprendiz_1_correo: textAlias(formData, ["aprendiz_1_correo", "aprendiz1Correo"]),
    aprendiz_1_celular: textAlias(formData, ["aprendiz_1_celular", "aprendiz1Celular"]),
    aprendiz_1_ficha: textAlias(formData, ["aprendiz_1_ficha", "aprendiz1Ficha"]),
    aprendiz_2_nombre: textAlias(formData, ["aprendiz_2_nombre", "aprendiz2Nombre"]) || integrantes[1],
    aprendiz_2_documento: textAlias(formData, ["aprendiz_2_documento", "aprendiz2Documento"]),
    aprendiz_2_correo: textAlias(formData, ["aprendiz_2_correo", "aprendiz2Correo"]),
    aprendiz_2_celular: textAlias(formData, ["aprendiz_2_celular", "aprendiz2Celular"]),
    aprendiz_2_ficha: textAlias(formData, ["aprendiz_2_ficha", "aprendiz2Ficha"]),
    aprendiz_3_nombre: textAlias(formData, ["aprendiz_3_nombre", "aprendiz3Nombre"]) || integrantes[2],
    aprendiz_3_documento: textAlias(formData, ["aprendiz_3_documento", "aprendiz3Documento"]),
    aprendiz_3_correo: textAlias(formData, ["aprendiz_3_correo", "aprendiz3Correo"]),
    aprendiz_3_celular: textAlias(formData, ["aprendiz_3_celular", "aprendiz3Celular"]),
    aprendiz_3_ficha: textAlias(formData, ["aprendiz_3_ficha", "aprendiz3Ficha"]),
    categoria_presentacion: textAlias(formData, [
      "categoria_presentacion",
      "categoriaPresentacion",
    ]),
    requiere_conexion_electrica: booleanAlias(formData, [
      "requiere_conexion_electrica",
      "requiereConexionElectrica",
    ]),
    requiere_mesa_mobiliario: booleanAlias(formData, [
      "requiere_mesa_mobiliario",
      "requiereMesaMobiliario",
    ]),
    presenta_prototipo_funcional: booleanAlias(formData, [
      "presenta_prototipo_funcional",
      "presentaPrototipoFuncional",
    ]),
    requiere_otro_elemento: requiereOtroElemento,
    otro_elemento_descripcion: requiereOtroElemento
      ? textAlias(formData, ["otro_elemento_descripcion", "otroElementoDescripcion"])
      : "",
    observaciones_adicionales: textAlias(formData, [
      "observaciones_adicionales",
      "observacionesAdicionales",
      "resumen",
    ]),
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const useMockData = shouldUseMockData();
    console.log("[projects/register] USE_MOCK_DATA actual", process.env.USE_MOCK_DATA);
    console.log("[projects/register] modo", useMockData ? "mock" : "supabase");

    const normalizedPayload = normalizeRegistrationPayload(formData);
    console.log("[projects/register] payload recibido normalizado", normalizedPayload);
    const values = schema.parse(normalizedPayload);
    const file = fileAlias(formData, ["archivo_proyecto", "archivoProyecto"]);
    const poster = fileAlias(formData, ["poster_proyecto", "posterProyecto"]);
    console.log("[projects/register] archivo completo recibido", file ? {
      name: file.name,
      type: file.type,
      size: file.size,
    } : null);
    console.log("[projects/register] poster recibido", poster ? {
      name: poster.name,
      type: poster.type,
      size: poster.size,
    } : null);

    if (useMockData) {
      const mockProject = {
        codigo_proyecto: "EXPOCAM-2026-0001",
        ...values,
        estado_proyecto: "Registrado",
        estado_evaluacion_humana: "Pendiente",
        estado_analisis_ia: "Pendiente",
        estado_lectura_archivo: "Pendiente",
      };
      console.log("[projects/register] payload mock", mockProject);
      return NextResponse.json(
        {
          project: mockProject,
        },
        { status: 201 },
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "El archivo del proyecto es obligatorio." },
        { status: 400 },
      );
    }

    const codigoProyecto = await generateProjectCode();
    const archivoProyectoPath = await uploadProjectFile(file, codigoProyecto, "archivo");
    const posterProyectoPath = poster
      ? await uploadProjectFile(poster, codigoProyecto, "poster")
      : "";
    console.log("[projects/register] rutas subidas a Storage", {
      archivoProyectoPath,
      posterProyectoPath,
    });

    const projectPayload = {
      codigo_proyecto: codigoProyecto,
      ...values,
      archivo_proyecto_path: archivoProyectoPath,
      archivo_proyecto_nombre: file.name,
      archivo_proyecto_tipo: file.type || "application/octet-stream",
      archivo_proyecto_size: file.size,
      poster_proyecto_path: posterProyectoPath,
      poster_proyecto_nombre: poster?.name ?? "",
      poster_proyecto_tipo: poster?.type || "",
      poster_proyecto_size: poster?.size ?? 0,
    };
    console.log("[projects/register] payload insertado en Supabase", projectPayload);
    const project = await createProject(projectPayload);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[projects/register] error exacto en API", error);
    const message = error instanceof Error ? error.message : "No se pudo registrar el proyecto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
