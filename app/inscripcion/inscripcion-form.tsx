"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { useFieldArray, useForm, type UseFormRegister, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ESTADOS_DESARROLLO_PROYECTO,
  LINEAS_TEMATICAS,
  MODALIDADES_PARTICIPACION,
  NIVELES_MADUREZ,
  PRODUCTOS_OBTENIDOS,
  SEMILLEROS,
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { validateMinorConsentFile, validatePosterFile } from "@/lib/upload-limits";

const optionalEmail = z.union([z.string().email("Ingrese un correo electrónico válido."), z.literal("")]).optional();

const autorPrincipalSchema = z.object({
  nombreCompleto: z.string().min(3, "Indica el nombre del autor principal."),
  documento: z.string().optional(),
  correo: z.string().email("Ingrese un correo electrónico válido."),
  celular: z.string().min(7, "Indica el celular del autor principal."),
});

const aprendizSchema = z.object({
  nombreCompleto: z.string().min(3, "Indica el nombre del aprendiz."),
  documento: z.string().min(5, "Indica el documento del aprendiz."),
  correo: z.string().email("Ingrese un correo electrónico válido."),
  celular: z.string().min(7, "Indica el celular del aprendiz."),
  ficha: z.string().optional(),
  esMenorEdad: z.boolean(),
  tratamientoDatosMenorPath: z.string().optional(),
  tratamientoDatosMenorNombre: z.string().optional(),
  tratamientoDatosMenorTipo: z.string().optional(),
  tratamientoDatosMenorSize: z.number().optional(),
});

const instructorSchema = z.object({
  nombreCompleto: z.string().min(3, "Indica el nombre del instructor."),
  documento: z.string().min(5, "Indica el documento del instructor."),
  correo: z.string().email("Ingrese un correo electrónico válido."),
  celular: z.string().min(7, "Indica el celular del instructor."),
  rol: z.enum(["Instructor", "Investigador asociado"], {
    message: "Selecciona el rol dentro del proyecto.",
  }),
});

const schema = z.object({
  titulo: z.string().min(5, "Escribe el titulo del proyecto."),
  area_conocimiento: z.string().min(1, "Seleccione una línea temática."),
  linea_tematica_otro: z.string().optional(),
  linea_investigacion: z.string().optional(),
  resumen_problema: z.string().min(10, "Describe el problema."),
  resumen_objetivo: z.string().min(10, "Describe el objetivo."),
  resumen_metodologia: z.string().min(10, "Complete la metodología del resumen científico."),
  resumen_resultados: z.string().min(10, "Describe los resultados."),
  resumen_conclusiones: z.string().min(10, "Describe las conclusiones."),
  modalidades_proyecto: z.array(z.string()).min(1, "Selecciona al menos una modalidad."),
  modalidad_otro: z.string().optional(),
  modalidad_participacion: z.string().optional(),
  estado_desarrollo_proyecto: z.string().min(1, "Selecciona el estado del proyecto."),
  productos_obtenidos: z.array(z.string()).min(1, "Selecciona al menos un producto obtenido."),
  productos_obtenidos_otro: z.string().optional(),
  nivel_madurez: z.string().min(1, "Selecciona el nivel de madurez."),
  semillero: z.string().min(1, "Selecciona un semillero."),
  semillero_otro: z.string().optional(),
  categoria_presentacion: z.literal("Poster"),
  institucion: z.string().min(2, "Indica la institucion."),
  municipio: z.string().min(2, "Indica el municipio."),
  integrantes: z.object({
    autorPrincipal: autorPrincipalSchema,
    aprendices: z.array(aprendizSchema).min(1, "Registra al menos un aprendiz participante."),
    instructoresInvestigadores: z.array(instructorSchema),
  }),
  requiere_conexion_electrica: z.boolean(),
  requiere_mesa_mobiliario: z.boolean(),
  presenta_prototipo_funcional: z.boolean(),
  requiere_otro_elemento: z.boolean(),
  otro_elemento_descripcion: z.string().optional(),
  requiere_certificado: z.string(),
  archivo_proyecto: z.any().optional(),
  poster_proyecto: z.any().optional(),
  observacion: z.string().max(1000, "La observación no puede superar 1000 caracteres.").optional(),
}).superRefine((values, ctx) => {
  if (values.area_conocimiento === "Otra" && !values.linea_tematica_otro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["linea_tematica_otro"],
      message: "Escriba cuál es la línea temática.",
    });
  }

  if (values.semillero === "Otro" && !values.semillero_otro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["semillero_otro"],
      message: "Escriba cuál es el semillero.",
    });
  }

  if (values.modalidades_proyecto.includes("Otro") && !values.modalidad_otro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["modalidad_otro"],
      message: "Escriba cuál es la modalidad.",
    });
  }

  if (values.productos_obtenidos.includes("Otro") && !values.productos_obtenidos_otro?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["productos_obtenidos_otro"],
      message: "Escriba cuál es el producto obtenido.",
    });
  }

  values.integrantes.aprendices.forEach((aprendiz, index) => {
    if (aprendiz.esMenorEdad && !aprendiz.tratamientoDatosMenorPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["integrantes", "aprendices", index, "tratamientoDatosMenorPath"],
        message: "Carga el PDF de tratamiento de datos para menor de edad.",
      });
    }
  });

});

export type FormValues = z.infer<typeof schema>;

const booleanFields = new Set([
  "requiere_conexion_electrica",
  "requiere_mesa_mobiliario",
  "presenta_prototipo_funcional",
  "requiere_otro_elemento",
]);

type UploadKind = "archivo" | "poster";
type UploadStatus = "idle" | "uploading" | "uploaded" | "error";
type MinorConsentUploadState = Record<string, { status: UploadStatus; error?: string | null }>;

interface UploadedFileMetadata {
  path: string;
  nombre: string;
  tipo: string;
  size: number;
}

function createCodigoTemporal() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function trimValue(value?: string) {
  return value?.trim() ?? "";
}

function isTouchedPath(touchedFields: unknown, path: Array<string | number>) {
  let current: unknown = touchedFields;

  for (const segment of path) {
    if (!current || typeof current !== "object") {
      return false;
    }

    current = (current as Record<string, unknown>)[String(segment)];
  }

  return Boolean(current);
}

function legacyTeamFields(values: FormValues) {
  const aprendices = values.integrantes.aprendices;
  const instructores = values.integrantes.instructoresInvestigadores.filter((member) => member.rol === "Instructor");
  const legacy: Record<string, string> = {};

  ([0, 1, 2] as const).forEach((index) => {
    const aprendiz = aprendices[index];
    const legacyIndex = index + 1;
    legacy[`aprendiz_${legacyIndex}_nombre`] = trimValue(aprendiz?.nombreCompleto);
    legacy[`aprendiz_${legacyIndex}_documento`] = trimValue(aprendiz?.documento);
    legacy[`aprendiz_${legacyIndex}_correo`] = trimValue(aprendiz?.correo);
    legacy[`aprendiz_${legacyIndex}_celular`] = trimValue(aprendiz?.celular);
    legacy[`aprendiz_${legacyIndex}_ficha`] = trimValue(aprendiz?.ficha);
  });

  ([0, 1, 2] as const).forEach((index) => {
    const instructor = instructores[index];
    const prefix = index === 0 ? "instructor" : `instructor_${index + 1}`;
    legacy[`${prefix}_nombre`] = trimValue(instructor?.nombreCompleto);
    legacy[`${prefix}_documento`] = trimValue(instructor?.documento);
    legacy[`${prefix}_correo`] = trimValue(instructor?.correo);
    legacy[`${prefix}_celular`] = trimValue(instructor?.celular);
  });

  return legacy;
}

function resumenCientifico(values: FormValues) {
  return [
    `Problema:\n${values.resumen_problema}`,
    `Objetivo:\n${values.resumen_objetivo}`,
    `Metodología:\n${values.resumen_metodologia}`,
    `Resultados:\n${values.resumen_resultados}`,
    `Conclusiones:\n${values.resumen_conclusiones}`,
  ].join("\n\n");
}

function modalidadCompatibilidad(values: FormValues) {
  return values.modalidades_proyecto
    .map((modalidad) => modalidad === "Otro" ? trimValue(values.modalidad_otro) : modalidad)
    .filter(Boolean)
    .join(", ");
}

function productoCompatibilidad(values: FormValues) {
  return values.productos_obtenidos
    .map((producto) => producto === "Otro" ? trimValue(values.productos_obtenidos_otro) : producto)
    .filter(Boolean);
}

function uploadValidationError(kind: UploadKind, reason?: string, fallback?: string) {
  if (kind === "archivo") {
    if (reason === "size") {
      return "El archivo supera el límite de 8 MB.";
    }
    if (reason === "editable") {
      return "No se permiten formatos editables. Exporte el documento como PDF.";
    }

    return fallback ?? "El documento del proyecto debe estar en PDF.";
  }

  if (reason === "size") {
    return "El póster supera el límite de 3 MB.";
  }
  if (reason === "editable") {
    return "No se permiten formatos editables. Exporte el póster como PDF o imagen.";
  }

  return fallback ?? "El póster solo puede ser PDF, JPG, PNG o WEBP.";
}

function minorConsentValidationError(reason?: string, fallback?: string) {
  if (reason === "size") {
    return "La autorización para tratamiento de datos del menor de edad supera el límite de 5 MB.";
  }
  if (reason === "editable") {
    return "La autorización para tratamiento de datos del menor de edad debe estar en PDF.";
  }

  return fallback ?? "La autorización para tratamiento de datos del menor de edad debe estar en PDF.";
}

export function InscripcionForm({
  mode = "create",
  initialValues,
  projectId,
  projectCode,
  requesterDocument,
  hasEvaluations = false,
}: {
  mode?: "create" | "edit";
  initialValues?: Partial<FormValues>;
  projectId?: string;
  projectCode?: string;
  requesterDocument?: string;
  hasEvaluations?: boolean;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [codigoTemporal] = useState(createCodigoTemporal);
  const [archivoStatus, setArchivoStatus] = useState<UploadStatus>("idle");
  const [posterStatus, setPosterStatus] = useState<UploadStatus>("idle");
  const [archivoMetadata, setArchivoMetadata] = useState<UploadedFileMetadata | null>(null);
  const [posterMetadata, setPosterMetadata] = useState<UploadedFileMetadata | null>(null);
  const [archivoError, setArchivoError] = useState<string | null>(null);
  const [posterError, setPosterError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting, isSubmitted, touchedFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      integrantes: {
        autorPrincipal: {
          nombreCompleto: "",
          documento: "",
          correo: "",
          celular: "",
        },
        aprendices: [
          {
            nombreCompleto: "",
            documento: "",
            correo: "",
            celular: "",
            ficha: "",
            esMenorEdad: false,
            tratamientoDatosMenorPath: "",
            tratamientoDatosMenorNombre: "",
            tratamientoDatosMenorTipo: "",
            tratamientoDatosMenorSize: 0,
          },
        ],
        instructoresInvestigadores: [],
      },
      requiere_certificado: "Si",
      modalidades_proyecto: [],
      productos_obtenidos: [],
      requiere_conexion_electrica: false,
      requiere_mesa_mobiliario: false,
      presenta_prototipo_funcional: false,
      requiere_otro_elemento: false,
      categoria_presentacion: "Poster",
      ...initialValues,
    },
  });
  const requiereOtroElemento = watch("requiere_otro_elemento");
  const lineaTematica = watch("area_conocimiento");
  const semilleroSeleccionado = watch("semillero");
  const modalidadesSeleccionadas = watch("modalidades_proyecto") ?? [];
  const productosSeleccionados = watch("productos_obtenidos") ?? [];
  const aprendicesValues = watch("integrantes.aprendices") ?? [];
  const archivoProyectoRegister = register("archivo_proyecto");
  const posterProyectoRegister = register("poster_proyecto");
  const [minorConsentUploads, setMinorConsentUploads] = useState<MinorConsentUploadState>({});
  const aprendicesArray = useFieldArray({
    control,
    name: "integrantes.aprendices",
  });
  const instructoresInvestigadoresArray = useFieldArray({
    control,
    name: "integrantes.instructoresInvestigadores",
  });
  const showFieldError = (path: Array<string | number>) => isSubmitted || isTouchedPath(touchedFields, path);

  async function uploadSelectedFile(kind: UploadKind, file: File) {
    const setStatus = setPosterStatus;
    const setMetadata = setPosterMetadata;
    const setError = setPosterError;
    const validation = validatePosterFile(file);

    setMetadata(null);
    setError(null);

    console.log("[inscripcion] validacion de archivo seleccionado", {
      kind,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      valid: validation.valid,
      reason: validation.reason,
    });

    if (!validation.valid) {
      console.warn("[inscripcion] archivo rechazado antes de solicitar signed upload URL", {
        kind,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        reason: validation.reason,
      });
      setStatus("error");
      setError(uploadValidationError(kind, validation.reason, validation.error));
      return;
    }

    setStatus("uploading");

    try {
      const contentType = file.type || "application/octet-stream";
      console.log("[inscripcion] solicitando signed upload URL", {
        kind,
        fileName: file.name,
        contentType,
        fileSize: file.size,
      });
      const response = await fetch("/api/storage/create-upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigoTemporal,
          tipo: kind,
          fileName: file.name,
          contentType,
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "No se pudo preparar la subida del archivo.");
      }

      const uploadTarget = await response.json() as {
        path: string;
        token: string;
        signedUrl?: string;
      };
      console.log("[inscripcion] signed upload URL recibida", {
        kind,
        path: uploadTarget.path,
        signedUrl: uploadTarget.signedUrl,
      });

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.storage
        .from("project-files")
        .uploadToSignedUrl(uploadTarget.path, uploadTarget.token, file, {
          contentType,
        });

      if (error) {
        console.error("[inscripcion] error exacto subiendo a Supabase Storage", error);
        throw error;
      }

      const metadata = {
        path: uploadTarget.path,
        nombre: file.name,
        tipo: contentType,
        size: file.size,
      };
      setMetadata(metadata);
      setStatus("uploaded");
      console.log("[inscripcion] subida completada en cliente", {
        kind,
        ...metadata,
      });
    } catch (error) {
      console.error("[inscripcion] error exacto al subir archivo", error);
      setStatus("error");
      setError(error instanceof Error ? error.message : "No se pudo subir el archivo.");
    }
  }

  async function uploadMinorConsentFile(index: number, fieldId: string, file: File) {
    const validation = validateMinorConsentFile(file);
    setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorPath`, "");
    setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorNombre`, "");
    setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorTipo`, "");
    setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorSize`, 0);
    setMinorConsentUploads((current) => ({
      ...current,
      [fieldId]: {
        status: validation.valid ? "uploading" : "error",
        error: validation.valid ? null : minorConsentValidationError(validation.reason, validation.error),
      },
    }));

    if (!validation.valid) {
      return;
    }

    try {
      const contentType = file.type || "application/pdf";
      const response = await fetch("/api/storage/create-upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigoTemporal,
          tipo: "minor-consent",
          fileName: file.name,
          contentType,
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "No se pudo preparar la carga de la autorización.");
      }

      const uploadTarget = await response.json() as {
        path: string;
        token: string;
      };
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.storage
        .from("project-files")
        .uploadToSignedUrl(uploadTarget.path, uploadTarget.token, file, {
          contentType,
        });

      if (error) {
        throw error;
      }

      setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorPath`, uploadTarget.path, { shouldValidate: true });
      setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorNombre`, file.name);
      setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorTipo`, contentType);
      setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorSize`, file.size);
      setMinorConsentUploads((current) => ({
        ...current,
        [fieldId]: { status: "uploaded", error: null },
      }));
    } catch (error) {
      setMinorConsentUploads((current) => ({
        ...current,
        [fieldId]: {
          status: "error",
          error: error instanceof Error ? error.message : "No se pudo cargar la autorización.",
        },
      }));
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    if (posterStatus === "uploading") {
      setSubmitError("Espera a que termine la subida de archivos.");
      return;
    }
    if (posterStatus === "error") {
      setSubmitError("Corrige el error del póster antes de registrar.");
      return;
    }
    if (Object.values(minorConsentUploads).some((item) => item.status === "uploading")) {
      setSubmitError("Espere a que termine la carga de autorizaciones de menores de edad.");
      return;
    }
    if (Object.values(minorConsentUploads).some((item) => item.status === "error")) {
      setSubmitError("Corrija el error de la autorización del menor de edad antes de registrar el proyecto.");
      return;
    }
    const payload = Object.fromEntries(
      Object.entries(values)
        .filter(([key]) => key !== "archivo_proyecto" && key !== "poster_proyecto" && key !== "integrantes")
        .map(([key, value]) => [
          key,
          booleanFields.has(key) ? Boolean(value) : Array.isArray(value) ? value : String(value ?? ""),
        ]),
    );
    const finalPayload = {
      ...payload,
      ...legacyTeamFields(values),
      resumen: resumenCientifico(values),
      observaciones_adicionales: resumenCientifico(values),
      modalidad_participacion: modalidadCompatibilidad(values),
      productos_obtenidos: productoCompatibilidad(values),
      integrantes: values.integrantes,
      archivo_proyecto_path: "",
      archivo_proyecto_nombre: "",
      archivo_proyecto_tipo: "",
      archivo_proyecto_size: 0,
      poster_proyecto_path: posterMetadata?.path ?? "",
      poster_proyecto_nombre: posterMetadata?.nombre ?? "",
      poster_proyecto_tipo: posterMetadata?.tipo ?? "",
      poster_proyecto_size: posterMetadata?.size ?? 0,
    };
    const requestPayload = mode === "edit" ? {
      ...finalPayload,
      proyecto_id: projectId,
      codigo_proyecto: projectCode,
      documento_solicitante: requesterDocument,
    } : finalPayload;
    console.log("[inscripcion] payload final", requestPayload);

    const response = await fetch(mode === "edit" ? "/api/projects/update-registration" : "/api/projects/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      console.error("[inscripcion] error exacto si falla registro de proyecto", payload);
      setSubmitError(payload?.error ?? "No se pudo registrar el proyecto.");
      return;
    }

    router.push(mode === "edit" ? "/inscripcion/editar/gracias" : "/inscripcion/gracias");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <input type="hidden" value="Si" {...register("requiere_certificado")} />
      <input type="hidden" value="Poster" {...register("categoria_presentacion")} />

      {mode === "edit" ? (
        <div className="grid gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Está editando una inscripción existente. Los cambios reemplazarán la información registrada previamente.</p>
          <p>Código del proyecto: <strong>{projectCode}</strong></p>
          {hasEvaluations ? <p className="font-semibold">Este proyecto ya tiene evaluaciones registradas. Los cambios pueden afectar la coherencia de la evaluación.</p> : null}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white/45 p-5">
        <p className="font-sans text-base font-extrabold text-[var(--color-text)]">Información general del proyecto</p>
        <div className="grid gap-2">
          <Label htmlFor="titulo">Título del proyecto</Label>
          <Input id="titulo" {...register("titulo")} />
          <ErrorText message={errors.titulo?.message} show={showFieldError(["titulo"])} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="area_conocimiento">Línea temática</Label>
            <select
              id="area_conocimiento"
              className="h-11 rounded-xl border border-[var(--color-border)] bg-white/70 px-3 text-sm"
              {...register("area_conocimiento")}
            >
              <option value="">Seleccionar</option>
              {LINEAS_TEMATICAS.map((linea) => (
                <option key={linea}>{linea}</option>
              ))}
            </select>
            <ErrorText message={errors.area_conocimiento?.message} show={showFieldError(["area_conocimiento"])} />
          </div>
          {lineaTematica === "Otra" ? (
            <Field id="linea_tematica_otro" label="¿Cuál línea temática?" register={register("linea_tematica_otro")} error={errors.linea_tematica_otro?.message} showError={showFieldError(["linea_tematica_otro"])} />
          ) : null}
          <SelectField id="semillero" label="Semillero" options={SEMILLEROS} register={register("semillero")} />
          {semilleroSeleccionado === "Otro" ? (
            <Field id="semillero_otro" label="¿Cuál semillero?" register={register("semillero_otro")} error={errors.semillero_otro?.message} showError={showFieldError(["semillero_otro"])} />
          ) : null}
          <Field id="institucion" label="Institución" register={register("institucion")} error={errors.institucion?.message} />
          <Field id="municipio" label="Municipio" register={register("municipio")} error={errors.municipio?.message} />
        </div>
        <div className="grid gap-2 rounded-xl border border-[var(--color-border)] bg-white/55 p-4">
          <p className="text-sm font-semibold text-[var(--color-muted)]">Categoría de participación</p>
          <p className="font-sans text-lg font-extrabold text-[var(--color-text)]">Póster</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white/45 p-5">
        <p className="font-sans text-base font-extrabold text-[var(--color-text)]">Resumen científico</p>
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField id="resumen_problema" label="Problema" register={register("resumen_problema")} error={errors.resumen_problema?.message} />
          <TextAreaField id="resumen_objetivo" label="Objetivo" register={register("resumen_objetivo")} error={errors.resumen_objetivo?.message} />
          <TextAreaField id="resumen_metodologia" label="Metodología" register={register("resumen_metodologia")} error={errors.resumen_metodologia?.message} />
          <TextAreaField id="resumen_resultados" label="Resultados" register={register("resumen_resultados")} error={errors.resumen_resultados?.message} />
          <div className="md:col-span-2">
            <TextAreaField id="resumen_conclusiones" label="Conclusiones" register={register("resumen_conclusiones")} error={errors.resumen_conclusiones?.message} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-[var(--color-border)] bg-white/45 p-5">
        <p className="font-sans text-base font-extrabold text-[var(--color-text)]">Modalidad y estado del proyecto</p>
        <CheckGroup title="Modalidad" options={MODALIDADES_PARTICIPACION} register={register} name="modalidades_proyecto" />
        <ErrorText message={errors.modalidades_proyecto?.message} show={isSubmitted} />
        {modalidadesSeleccionadas.includes("Otro") ? (
          <Field id="modalidad_otro" label="¿Cuál modalidad?" register={register("modalidad_otro")} error={errors.modalidad_otro?.message} showError={showFieldError(["modalidad_otro"])} />
        ) : null}

        <RadioGroup title="Estado del proyecto" options={ESTADOS_DESARROLLO_PROYECTO} register={register("estado_desarrollo_proyecto")} />
        <ErrorText message={errors.estado_desarrollo_proyecto?.message} show={isSubmitted} />

        <CheckGroup title="Productos obtenidos" options={PRODUCTOS_OBTENIDOS} register={register} name="productos_obtenidos" />
        <ErrorText message={errors.productos_obtenidos?.message} show={isSubmitted} />
        {productosSeleccionados.includes("Otro") ? (
          <Field id="productos_obtenidos_otro" label="¿Cuál producto obtenido?" register={register("productos_obtenidos_otro")} error={errors.productos_obtenidos_otro?.message} showError={showFieldError(["productos_obtenidos_otro"])} />
        ) : null}

        <RadioGroup title="Nivel de madurez" options={NIVELES_MADUREZ} register={register("nivel_madurez")} />
        <ErrorText message={errors.nivel_madurez?.message} show={isSubmitted} />
      </section>

      <section className="grid gap-5 rounded-2xl border border-[var(--color-border)] bg-white/45 p-5">
        <div>
          <p className="font-sans text-base font-extrabold text-[var(--color-text)]">Equipo del proyecto</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Registra autor principal, aprendices participantes, instructores e investigadores asociados.
          </p>
        </div>

        <div className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-white/55 p-4">
          <p className="text-sm font-extrabold text-[var(--color-text)]">Autor principal *</p>
          <div className="grid gap-3 md:grid-cols-4">
            <Field id="autor_principal_nombre" label="Nombre completo" register={register("integrantes.autorPrincipal.nombreCompleto")} error={errors.integrantes?.autorPrincipal?.nombreCompleto?.message} showError={showFieldError(["integrantes", "autorPrincipal", "nombreCompleto"])} />
            <Field id="autor_principal_documento" label="Documento, si aplica" register={register("integrantes.autorPrincipal.documento")} error={errors.integrantes?.autorPrincipal?.documento?.message} showError={showFieldError(["integrantes", "autorPrincipal", "documento"])} />
            <Field id="autor_principal_correo" label="Correo" type="email" register={register("integrantes.autorPrincipal.correo")} error={errors.integrantes?.autorPrincipal?.correo?.message} showError={showFieldError(["integrantes", "autorPrincipal", "correo"])} />
            <Field id="autor_principal_celular" label="Celular" register={register("integrantes.autorPrincipal.celular")} error={errors.integrantes?.autorPrincipal?.celular?.message} showError={showFieldError(["integrantes", "autorPrincipal", "celular"])} />
          </div>
        </div>

        <TeamBlock
          title="Aprendices participantes"
          error={errors.integrantes?.aprendices?.message}
          showError={isSubmitted}
          addLabel="+ Agregar aprendiz"
          onAdd={() => aprendicesArray.append({
            nombreCompleto: "",
            documento: "",
            correo: "",
            celular: "",
            ficha: "",
            esMenorEdad: false,
            tratamientoDatosMenorPath: "",
            tratamientoDatosMenorNombre: "",
            tratamientoDatosMenorTipo: "",
            tratamientoDatosMenorSize: 0,
          })}
        >
          {aprendicesArray.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-white/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-[var(--color-text)]">Aprendiz {index + 1}</p>
                <Button type="button" variant="outline" size="sm" disabled={aprendicesArray.fields.length === 1} onClick={() => aprendicesArray.remove(index)}>Eliminar</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <Field id={`aprendiz_${index}_nombre`} label="Nombre completo" register={register(`integrantes.aprendices.${index}.nombreCompleto`)} error={errors.integrantes?.aprendices?.[index]?.nombreCompleto?.message} showError={showFieldError(["integrantes", "aprendices", index, "nombreCompleto"])} />
                <Field id={`aprendiz_${index}_documento`} label="Documento" register={register(`integrantes.aprendices.${index}.documento`)} error={errors.integrantes?.aprendices?.[index]?.documento?.message} showError={showFieldError(["integrantes", "aprendices", index, "documento"])} />
                <Field id={`aprendiz_${index}_correo`} label="Correo" type="email" register={register(`integrantes.aprendices.${index}.correo`)} error={errors.integrantes?.aprendices?.[index]?.correo?.message} showError={showFieldError(["integrantes", "aprendices", index, "correo"])} />
                <Field id={`aprendiz_${index}_celular`} label="Celular" register={register(`integrantes.aprendices.${index}.celular`)} error={errors.integrantes?.aprendices?.[index]?.celular?.message} showError={showFieldError(["integrantes", "aprendices", index, "celular"])} />
                <Field id={`aprendiz_${index}_ficha`} label="Ficha, opcional" register={register(`integrantes.aprendices.${index}.ficha`)} error={errors.integrantes?.aprendices?.[index]?.ficha?.message} showError={showFieldError(["integrantes", "aprendices", index, "ficha"])} />
              </div>
              <CheckboxField
                id={`aprendiz_${index}_menor`}
                label="¿El aprendiz es menor de edad?"
                register={register(`integrantes.aprendices.${index}.esMenorEdad`)}
              />
              {aprendicesValues[index]?.esMenorEdad ? (
                <div className="grid gap-2 rounded-xl border border-dashed border-[#6D3FA9]/30 bg-white/48 p-4">
                  <Label htmlFor={`aprendiz_${index}_tratamiento`} className="inline-flex items-center gap-2">
                    <Upload className="size-4" />
                    Tratamiento de datos / autorización para menor de edad
                  </Label>
                  <Input
                    id={`aprendiz_${index}_tratamiento`}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={async (event) => {
                      const file = event.target.files?.item(0);
                      if (file) {
                        await uploadMinorConsentFile(index, field.id, file);
                      } else {
                        setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorPath`, "", { shouldValidate: true });
                        setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorNombre`, "");
                        setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorTipo`, "");
                        setValue(`integrantes.aprendices.${index}.tratamientoDatosMenorSize`, 0);
                        setMinorConsentUploads((current) => ({
                          ...current,
                          [field.id]: { status: "idle", error: null },
                        }));
                      }
                    }}
                  />
                  <p className="text-sm text-[var(--color-muted)]">Solo PDF. Máximo 5 MB.</p>
                  <UploadState
                    status={minorConsentUploads[field.id]?.status ?? "idle"}
                    uploadingText="Subiendo autorización..."
                    uploadedText="Autorización cargada correctamente"
                    defaultErrorText="Error al subir autorización"
                    error={minorConsentUploads[field.id]?.error}
                  />
                  <ErrorText message={errors.integrantes?.aprendices?.[index]?.tratamientoDatosMenorPath?.message} show={showFieldError(["integrantes", "aprendices", index, "tratamientoDatosMenorPath"])} />
                </div>
              ) : null}
            </div>
          ))}
        </TeamBlock>

        <TeamBlock
          title="Instructor(es) / Investigador(es) asociado(s)"
          addLabel="+ Agregar instructor o investigador asociado"
          onAdd={() => instructoresInvestigadoresArray.append({ nombreCompleto: "", documento: "", correo: "", celular: "", rol: "Instructor" })}
        >
          <p className="text-sm text-[var(--color-muted)]">
            Esta sección es opcional. Agregue instructores o investigadores asociados únicamente si el proyecto cuenta con ellos.
          </p>
          {instructoresInvestigadoresArray.fields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-white/55 p-4 text-sm text-[var(--color-muted)]">
              Puede agregar instructores o investigadores asociados si el proyecto los tiene.
            </div>
          ) : null}
          {instructoresInvestigadoresArray.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-white/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-[var(--color-text)]">Integrante {index + 1}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => instructoresInvestigadoresArray.remove(index)}>Eliminar</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <Field id={`instructor_investigador_${index}_nombre`} label="Nombre completo" register={register(`integrantes.instructoresInvestigadores.${index}.nombreCompleto`)} error={errors.integrantes?.instructoresInvestigadores?.[index]?.nombreCompleto?.message} showError={showFieldError(["integrantes", "instructoresInvestigadores", index, "nombreCompleto"])} />
                <Field id={`instructor_investigador_${index}_documento`} label="Documento" register={register(`integrantes.instructoresInvestigadores.${index}.documento`)} error={errors.integrantes?.instructoresInvestigadores?.[index]?.documento?.message} showError={showFieldError(["integrantes", "instructoresInvestigadores", index, "documento"])} />
                <Field id={`instructor_investigador_${index}_correo`} label="Correo" type="email" register={register(`integrantes.instructoresInvestigadores.${index}.correo`)} error={errors.integrantes?.instructoresInvestigadores?.[index]?.correo?.message} showError={showFieldError(["integrantes", "instructoresInvestigadores", index, "correo"])} />
                <Field id={`instructor_investigador_${index}_celular`} label="Celular" register={register(`integrantes.instructoresInvestigadores.${index}.celular`)} error={errors.integrantes?.instructoresInvestigadores?.[index]?.celular?.message} showError={showFieldError(["integrantes", "instructoresInvestigadores", index, "celular"])} />
                <div className="grid gap-2">
                  <Label htmlFor={`instructor_investigador_${index}_rol`}>Rol dentro del proyecto</Label>
                  <select
                    id={`instructor_investigador_${index}_rol`}
                    className="h-11 rounded-xl border border-[var(--color-border)] bg-white/70 px-3 text-sm"
                    {...register(`integrantes.instructoresInvestigadores.${index}.rol`)}
                  >
                    <option value="Instructor">Instructor</option>
                    <option value="Investigador asociado">Investigador asociado</option>
                  </select>
                  <ErrorText message={errors.integrantes?.instructoresInvestigadores?.[index]?.rol?.message} show={showFieldError(["integrantes", "instructoresInvestigadores", index, "rol"])} />
                </div>
              </div>
            </div>
          ))}
        </TeamBlock>
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white/45 p-5">
        <p className="font-sans text-base font-extrabold text-[var(--color-text)]">Requisitos del stand</p>
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxField id="requiere_conexion_electrica" label="El stand necesita punto de electricidad" register={register("requiere_conexion_electrica")} />
          <CheckboxField id="requiere_mesa_mobiliario" label="Requiere mesa o mobiliario especial" register={register("requiere_mesa_mobiliario")} />
          <CheckboxField id="presenta_prototipo_funcional" label="Presentara prototipo funcional" register={register("presenta_prototipo_funcional")} />
          <CheckboxField id="requiere_otro_elemento" label="Requiere otro elemento" register={register("requiere_otro_elemento")} />
        </div>
        {requiereOtroElemento ? (
          <div className="grid gap-2">
            <Label htmlFor="otro_elemento_descripcion">Describa el elemento adicional requerido</Label>
            <Textarea id="otro_elemento_descripcion" rows={3} {...register("otro_elemento_descripcion")} />
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white/45 p-5">
        <p className="font-sans text-base font-extrabold text-[var(--color-text)]">Archivos del proyecto</p>
        <div className="grid gap-4 md:grid-cols-2">
        <div className="hidden">
          <Label htmlFor="archivo_proyecto" className="inline-flex items-center gap-2">
            <Upload className="size-4" />
            Archivo del proyecto
          </Label>
          <Input
            id="archivo_proyecto"
            type="file"
            accept=".pdf,application/pdf"
            name={archivoProyectoRegister.name}
            ref={archivoProyectoRegister.ref}
            onBlur={archivoProyectoRegister.onBlur}
            onChange={async (event) => {
              await archivoProyectoRegister.onChange(event);
              const file = event.target.files?.item(0);
              if (file) {
                await uploadSelectedFile("archivo", file);
              } else {
                setArchivoMetadata(null);
                setArchivoError(null);
                setArchivoStatus("idle");
              }
            }}
          />
          <p className="text-sm text-[var(--color-muted)]">
            Suba el documento final del proyecto en PDF. Máximo 8 MB. No se permiten archivos editables como Word, PowerPoint o Excel.
          </p>
          <UploadState
            status={archivoStatus}
            uploadingText="Subiendo archivo..."
            uploadedText="Archivo cargado correctamente"
            defaultErrorText="Error al subir archivo"
            error={archivoError}
          />
        </div>
        <div className="grid gap-2 rounded-2xl border border-dashed border-[#6D3FA9]/30 bg-white/48 p-5">
          <Label htmlFor="poster_proyecto" className="inline-flex items-center gap-2">
            <Upload className="size-4" />
            Póster del proyecto
          </Label>
          <Input
            id="poster_proyecto"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            name={posterProyectoRegister.name}
            ref={posterProyectoRegister.ref}
            onBlur={posterProyectoRegister.onBlur}
            onChange={async (event) => {
              await posterProyectoRegister.onChange(event);
              const file = event.target.files?.item(0);
              if (file) {
                await uploadSelectedFile("poster", file);
              } else {
                setPosterMetadata(null);
                setPosterError(null);
                setPosterStatus("idle");
              }
            }}
          />
          <p className="text-sm text-[var(--color-muted)]">
            Suba el póster en PDF o imagen JPG, PNG o WEBP. Máximo 3 MB. No se permiten archivos editables.
          </p>
          <UploadState
            status={posterStatus}
            uploadingText="Subiendo póster..."
            uploadedText="Póster cargado correctamente"
            defaultErrorText="Error al subir póster"
            error={posterError}
          />
        </div>
        </div>
      </section>

      <p className="text-sm font-semibold text-[var(--color-muted)]">
        Este límite mantiene el almacenamiento de pósteres dentro del espacio disponible.
      </p>

      {submitError ? <p className="text-sm font-semibold text-red-700">{submitError}</p> : null}

      {mode === "edit" ? <div className="grid gap-2"><Label htmlFor="observacion">Observación de la corrección, opcional</Label><Textarea id="observacion" rows={3} {...register("observacion")} /></div> : null}

      <Button
        type="submit"
        size="lg"
        disabled={
          isSubmitting ||
          posterStatus === "uploading" ||
          posterStatus === "error" ||
          Object.values(minorConsentUploads).some((item) => item.status === "uploading")
        }
      >
        {mode === "edit" ? "Guardar cambios" : "Registrar proyecto"}
      </Button>
    </form>
  );
}

function UploadState({
  status,
  uploadingText,
  uploadedText,
  defaultErrorText,
  error,
}: {
  status: UploadStatus;
  uploadingText: string;
  uploadedText: string;
  defaultErrorText: string;
  error?: string | null;
}) {
  if (status === "uploading") {
    return <p className="text-sm font-semibold text-[var(--color-primary)]">{uploadingText}</p>;
  }
  if (status === "uploaded") {
    return <p className="text-sm font-semibold text-green-700">{uploadedText}</p>;
  }
  if (status === "error") {
    return <p className="text-sm font-semibold text-red-700">{error ?? defaultErrorText}</p>;
  }

  return null;
}

function TeamBlock({
  title,
  addLabel,
  onAdd,
  error,
  showError = true,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  error?: string;
  showError?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-white/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-sm font-extrabold text-[var(--color-text)]">{title}</p>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      <ErrorText message={error} show={showError} />
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  register,
  error,
  showError = true,
  type = "text",
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  showError?: boolean;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} {...register} />
      <ErrorText message={error} show={showError} />
    </div>
  );
}

function TextAreaField({
  id,
  label,
  register,
  error,
  showError = true,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  showError?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={4} {...register} />
      <ErrorText message={error} show={showError} />
    </div>
  );
}

function CheckGroup({
  title,
  options,
  register,
  name,
}: {
  title: string;
  options: readonly string[];
  register: UseFormRegister<FormValues>;
  name: "modalidades_proyecto" | "productos_obtenidos";
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-extrabold text-[var(--color-text)]">{title}</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/55 p-3 text-sm font-semibold text-[var(--color-text)]">
            <input type="checkbox" value={option} className="size-4 accent-[var(--color-primary)]" {...register(name)} />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function RadioGroup({
  title,
  options,
  register,
}: {
  title: string;
  options: readonly string[];
  register: UseFormRegisterReturn;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-extrabold text-[var(--color-text)]">{title}</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/55 p-3 text-sm font-semibold text-[var(--color-text)]">
            <input type="radio" value={option} className="size-4 accent-[var(--color-primary)]" {...register} />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  options,
  register,
}: {
  id: string;
  label: string;
  options: readonly string[];
  register: UseFormRegisterReturn;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className="h-11 rounded-xl border border-[var(--color-border)] bg-white/70 px-3 text-sm" {...register}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  id,
  label,
  register,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/55 p-3 text-sm font-semibold text-[var(--color-text)]">
      <input id={id} type="checkbox" className="size-4 accent-[var(--color-primary)]" {...register} />
      {label}
    </label>
  );
}

function ErrorText({ message, show = true }: { message?: string; show?: boolean }) {
  return message && show ? <p className="text-sm font-semibold text-red-700">{message}</p> : null;
}
