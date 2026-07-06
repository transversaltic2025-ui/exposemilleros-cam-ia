"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIAS_PRESENTACION,
  LINEAS_TEMATICAS,
  MODALIDADES_PARTICIPACION,
  SEMILLEROS,
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const optionalEmail = z.union([z.string().email("Correo invalido."), z.literal("")]).optional();

const schema = z.object({
  titulo: z.string().min(5, "Escribe el titulo del proyecto."),
  resumen: z.string().min(30, "Incluye un resumen mas completo."),
  area_conocimiento: z.string().min(1, "Selecciona un area."),
  linea_investigacion: z.string().min(3, "Indica la linea."),
  modalidad_participacion: z.string().min(1, "Selecciona una modalidad."),
  semillero: z.string().min(1, "Selecciona un semillero."),
  categoria_presentacion: z.string().min(1, "Selecciona una categoria."),
  institucion: z.string().min(2, "Indica la institucion."),
  municipio: z.string().min(2, "Indica el municipio."),
  aprendiz_1_nombre: z.string().min(3, "Indica el nombre del aprendiz 1."),
  aprendiz_1_documento: z.string().min(5, "Indica el documento del aprendiz 1."),
  aprendiz_1_correo: z.string().email("Correo invalido."),
  aprendiz_1_celular: z.string().min(7, "Indica el telefono del aprendiz 1."),
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
  instructor_nombre: z.string().min(3, "Indica el instructor."),
  instructor_documento: z.string().min(5, "Indica el documento del instructor 1."),
  instructor_correo: z.string().email("Correo invalido."),
  instructor_celular: z.string().min(7, "Celular invalido."),
  instructor_2_nombre: z.string().optional(),
  instructor_2_documento: z.string().optional(),
  instructor_2_correo: optionalEmail,
  instructor_2_celular: z.string().optional(),
  instructor_3_nombre: z.string().optional(),
  instructor_3_documento: z.string().optional(),
  instructor_3_correo: optionalEmail,
  instructor_3_celular: z.string().optional(),
  requiere_conexion_electrica: z.boolean(),
  requiere_mesa_mobiliario: z.boolean(),
  presenta_prototipo_funcional: z.boolean(),
  requiere_otro_elemento: z.boolean(),
  otro_elemento_descripcion: z.string().optional(),
  requiere_certificado: z.string(),
  archivo_proyecto: z.any().optional(),
  poster_proyecto: z.any().optional(),
}).superRefine((values, ctx) => {
  ([2, 3] as const).forEach((index) => {
    const fields = {
      nombre: values[`aprendiz_${index}_nombre`],
      documento: values[`aprendiz_${index}_documento`],
      correo: values[`aprendiz_${index}_correo`],
      celular: values[`aprendiz_${index}_celular`],
      ficha: values[`aprendiz_${index}_ficha`],
    };
    const hasAnyValue = Object.values(fields).some((value) => value && String(value).trim());
    if (!hasAnyValue) {
      return;
    }

    (["nombre", "documento", "correo", "celular"] as const).forEach((field) => {
      if (!fields[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Completa ${field} del aprendiz ${index}.`,
          path: [`aprendiz_${index}_${field === "celular" ? "celular" : field}`],
        });
      }
    });
  });

  ([2, 3] as const).forEach((index) => {
    const fields = {
      nombre: values[`instructor_${index}_nombre`],
      documento: values[`instructor_${index}_documento`],
      correo: values[`instructor_${index}_correo`],
      celular: values[`instructor_${index}_celular`],
    };
    const hasAnyValue = Object.values(fields).some((value) => value && String(value).trim());
    if (!hasAnyValue) {
      return;
    }

    (["nombre", "documento", "correo", "celular"] as const).forEach((field) => {
      if (!fields[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Completa ${field} del instructor ${index}.`,
          path: [`instructor_${index}_${field}`],
        });
      }
    });
  });
});

type FormValues = z.infer<typeof schema>;

const booleanFields = new Set([
  "requiere_conexion_electrica",
  "requiere_mesa_mobiliario",
  "presenta_prototipo_funcional",
  "requiere_otro_elemento",
]);

type UploadKind = "archivo" | "poster";
type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

interface UploadedFileMetadata {
  path: string;
  nombre: string;
  tipo: string;
  size: number;
}

function createCodigoTemporal() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function InscripcionForm() {
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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      instructor_documento: "",
      requiere_certificado: "Si",
      requiere_conexion_electrica: false,
      requiere_mesa_mobiliario: false,
      presenta_prototipo_funcional: false,
      requiere_otro_elemento: false,
    },
  });
  const requiereOtroElemento = watch("requiere_otro_elemento");
  const archivoProyectoRegister = register("archivo_proyecto");
  const posterProyectoRegister = register("poster_proyecto");

  async function uploadSelectedFile(kind: UploadKind, file: File) {
    const setStatus = kind === "archivo" ? setArchivoStatus : setPosterStatus;
    const setMetadata = kind === "archivo" ? setArchivoMetadata : setPosterMetadata;
    const setError = kind === "archivo" ? setArchivoError : setPosterError;

    setStatus("uploading");
    setMetadata(null);
    setError(null);

    try {
      const contentType = file.type || "application/octet-stream";
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

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    if (archivoStatus === "uploading" || posterStatus === "uploading") {
      setSubmitError("Espera a que termine la subida de archivos.");
      return;
    }
    if (!archivoMetadata) {
      setSubmitError("El archivo del proyecto es obligatorio y debe cargarse correctamente.");
      return;
    }

    const payload = Object.fromEntries(
      Object.entries(values)
        .filter(([key]) => key !== "archivo_proyecto" && key !== "poster_proyecto")
        .map(([key, value]) => [
          key,
          booleanFields.has(key) ? Boolean(value) : String(value ?? ""),
        ]),
    );
    const finalPayload = {
      ...payload,
      archivo_proyecto_path: archivoMetadata.path,
      archivo_proyecto_nombre: archivoMetadata.nombre,
      archivo_proyecto_tipo: archivoMetadata.tipo,
      archivo_proyecto_size: archivoMetadata.size,
      poster_proyecto_path: posterMetadata?.path ?? "",
      poster_proyecto_nombre: posterMetadata?.nombre ?? "",
      poster_proyecto_tipo: posterMetadata?.tipo ?? "",
      poster_proyecto_size: posterMetadata?.size ?? 0,
    };
    console.log("[inscripcion] payload final enviado a /api/projects/register", finalPayload);

    const response = await fetch("/api/projects/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalPayload),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      console.error("[inscripcion] error exacto si falla registro de proyecto", payload);
      setSubmitError(payload?.error ?? "No se pudo registrar el proyecto.");
      return;
    }

    router.push("/inscripcion/gracias");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <input type="hidden" value="Si" {...register("requiere_certificado")} />

      <div className="grid gap-2">
        <Label htmlFor="titulo">Titulo del proyecto</Label>
        <Input id="titulo" {...register("titulo")} />
        <ErrorText message={errors.titulo?.message} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="resumen">Resumen</Label>
        <Textarea id="resumen" rows={5} {...register("resumen")} />
        <ErrorText message={errors.resumen?.message} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="area_conocimiento">Linea tematica</Label>
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
          <ErrorText message={errors.area_conocimiento?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="linea_investigacion">Linea de investigacion</Label>
          <Input id="linea_investigacion" {...register("linea_investigacion")} />
          <ErrorText message={errors.linea_investigacion?.message} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField id="modalidad" label="Modalidad" options={MODALIDADES_PARTICIPACION} register={register("modalidad_participacion")} />
        <SelectField id="semillero" label="Semillero" options={SEMILLEROS} register={register("semillero")} />
        <SelectField id="categoria" label="Categoria" options={CATEGORIAS_PRESENTACION} register={register("categoria_presentacion")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="institucion">Institucion</Label>
          <Input id="institucion" defaultValue="Centro Agroempresarial y Minero" {...register("institucion")} />
          <ErrorText message={errors.institucion?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="municipio">Municipio</Label>
          <Input id="municipio" {...register("municipio")} />
          <ErrorText message={errors.municipio?.message} />
        </div>
      </div>

      <section className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white/45 p-5">
        <div>
          <p className="font-sans text-base font-extrabold text-[var(--color-text)]">Aprendices investigadores</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">El primer aprendiz es obligatorio. El segundo y tercero son opcionales.</p>
        </div>
        <AprendizFields index={1} required register={register} errors={errors} />
        <AprendizFields index={2} register={register} errors={errors} />
        <AprendizFields index={3} register={register} errors={errors} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white/45 p-5">
        <div>
          <p className="font-sans text-base font-extrabold text-[var(--color-text)]">Instructores líderes</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">El primer instructor es obligatorio. El segundo y tercero son opcionales.</p>
        </div>
        <InstructorFields index={1} required register={register} errors={errors} />
        <InstructorFields index={2} register={register} errors={errors} />
        <InstructorFields index={3} register={register} errors={errors} />
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2 rounded-2xl border border-dashed border-[#6D3FA9]/30 bg-white/48 p-5">
          <Label htmlFor="archivo_proyecto" className="inline-flex items-center gap-2">
            <Upload className="size-4" />
            Archivo del proyecto
          </Label>
          <Input
            id="archivo_proyecto"
            type="file"
            accept=".pdf,.doc,.docx"
            name={archivoProyectoRegister.name}
            ref={archivoProyectoRegister.ref}
            onBlur={archivoProyectoRegister.onBlur}
            onChange={async (event) => {
              await archivoProyectoRegister.onChange(event);
              const file = event.target.files?.item(0);
              if (file) {
                await uploadSelectedFile("archivo", file);
              }
            }}
          />
          <p className="text-sm text-[var(--color-muted)]">Se subirá directamente a Supabase Storage.</p>
          <UploadState status={archivoStatus} uploadedText="Archivo cargado correctamente" error={archivoError} />
        </div>
        <div className="grid gap-2 rounded-2xl border border-dashed border-[#6D3FA9]/30 bg-white/48 p-5">
          <Label htmlFor="poster_proyecto" className="inline-flex items-center gap-2">
            <Upload className="size-4" />
            Subir póster del proyecto
          </Label>
          <Input
            id="poster_proyecto"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            name={posterProyectoRegister.name}
            ref={posterProyectoRegister.ref}
            onBlur={posterProyectoRegister.onBlur}
            onChange={async (event) => {
              await posterProyectoRegister.onChange(event);
              const file = event.target.files?.item(0);
              if (file) {
                await uploadSelectedFile("poster", file);
              }
            }}
          />
          <p className="text-sm text-[var(--color-muted)]">Acepta PDF o imagen. Se subirá directamente a Supabase Storage.</p>
          <UploadState status={posterStatus} uploadedText="Póster cargado correctamente" error={posterError} />
        </div>
      </div>

      {submitError ? <p className="text-sm font-semibold text-red-700">{submitError}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting || archivoStatus === "uploading" || posterStatus === "uploading"}>
        Registrar proyecto
      </Button>
    </form>
  );
}

function UploadState({
  status,
  uploadedText,
  error,
}: {
  status: UploadStatus;
  uploadedText: string;
  error?: string | null;
}) {
  if (status === "uploading") {
    return <p className="text-sm font-semibold text-[var(--color-primary)]">Subiendo archivo...</p>;
  }
  if (status === "uploaded") {
    return <p className="text-sm font-semibold text-green-700">{uploadedText}</p>;
  }
  if (status === "error") {
    return <p className="text-sm font-semibold text-red-700">{error ?? "Error al subir archivo"}</p>;
  }

  return null;
}

function AprendizFields({
  index,
  required,
  register,
  errors,
}: {
  index: 1 | 2 | 3;
  required?: boolean;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-white/45 p-4">
      <p className="text-sm font-extrabold text-[var(--color-text)]">
        Aprendiz investigador {index}{required ? " *" : ""}
      </p>
      <div className="grid gap-3 md:grid-cols-5">
        <Field id={`aprendiz_${index}_nombre`} label="Nombre completo" register={register(`aprendiz_${index}_nombre`)} error={errors[`aprendiz_${index}_nombre`]?.message} />
        <Field id={`aprendiz_${index}_documento`} label="Numero de documento" register={register(`aprendiz_${index}_documento`)} error={errors[`aprendiz_${index}_documento`]?.message} />
        <Field id={`aprendiz_${index}_correo`} label="Correo" type="email" register={register(`aprendiz_${index}_correo`)} error={errors[`aprendiz_${index}_correo`]?.message} />
        <Field id={`aprendiz_${index}_celular`} label="Telefono" register={register(`aprendiz_${index}_celular`)} error={errors[`aprendiz_${index}_celular`]?.message} />
        <Field id={`aprendiz_${index}_ficha`} label="Ficha" register={register(`aprendiz_${index}_ficha`)} error={errors[`aprendiz_${index}_ficha`]?.message} />
      </div>
    </div>
  );
}

function InstructorFields({
  index,
  required,
  register,
  errors,
}: {
  index: 1 | 2 | 3;
  required?: boolean;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}) {
  const prefix = index === 1 ? "instructor" : `instructor_${index}`;
  const errorFor = (name: keyof FormValues) => {
    const message = errors[name]?.message;
    return typeof message === "string" ? message : undefined;
  };

  return (
    <div className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-white/45 p-4">
      <p className="text-sm font-extrabold text-[var(--color-text)]">
        Instructor líder {index}{required ? " *" : ""}
      </p>
      <div className="grid gap-3 md:grid-cols-4">
        <Field id={`${prefix}_nombre`} label="Nombre completo" register={register(`${prefix}_nombre` as keyof FormValues)} error={errorFor(`${prefix}_nombre` as keyof FormValues)} />
        <Field id={`${prefix}_documento`} label="Numero de documento" register={register(`${prefix}_documento` as keyof FormValues)} error={errorFor(`${prefix}_documento` as keyof FormValues)} />
        <Field id={`${prefix}_correo`} label="Correo" type="email" register={register(`${prefix}_correo` as keyof FormValues)} error={errorFor(`${prefix}_correo` as keyof FormValues)} />
        <Field id={`${prefix}_celular`} label="Celular / WhatsApp" register={register(`${prefix}_celular` as keyof FormValues)} error={errorFor(`${prefix}_celular` as keyof FormValues)} />
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  register,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} {...register} />
      <ErrorText message={error} />
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

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="text-sm font-semibold text-red-700">{message}</p> : null;
}
