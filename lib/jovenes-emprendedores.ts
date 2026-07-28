import { z } from "zod";

export const MUNICIPIOS_META = [
  "Acacías", "Barranca de Upía", "Cabuyaro", "Castilla La Nueva", "Cubarral",
  "Cumaral", "El Calvario", "El Castillo", "El Dorado", "Fuente de Oro",
  "Granada", "Guamal", "La Macarena", "Lejanías", "Mapiripán", "Mesetas",
  "Puerto Concordia", "Puerto Gaitán", "Puerto Lleras", "Puerto López",
  "Puerto Rico", "Restrepo", "San Carlos de Guaroa", "San Juan de Arama",
  "San Juanito", "San Martín", "Uribe", "Villavicencio", "Vistahermosa",
] as const;

export const GRUPOS_SISBEN = ["A", "B", "C"] as const;
export const ESTRATOS = ["1", "2", "3"] as const;
export const TIEMPOS_EXPERIENCIA = [
  "Menos de 6 meses",
  "Entre 6 meses y 1 año",
  "Entre 1 y 2 años",
  "Más de 2 años",
] as const;
export const TIPOS_JOVEN_EMPRENDEDOR = [
  "Jóvenes emprendedores CAM",
  "Jóvenes emprendedores Mixta",
] as const;

export const jovenEmprendedorSchema = z.object({
  nombre_completo: z.string().trim().min(3, "Ingrese el nombre completo.").max(160),
  documento: z.string().trim().min(5, "Ingrese un documento válido.").max(40),
  telefono: z.string().trim().min(7, "Ingrese un teléfono válido.").max(30),
  correo: z.string().trim().email("Ingrese un correo electrónico válido.").max(200),
  edad: z.number({ error: "Ingrese la edad." })
    .int()
    .min(18, "Solo se permite el registro de jóvenes emprendedores entre los 18 y 28 años.")
    .max(28, "Solo se permite el registro de jóvenes emprendedores entre los 18 y 28 años."),
  municipio_residencia: z.enum(MUNICIPIOS_META, { error: "Seleccione un municipio del Meta." }),
  grupo_sisben: z.enum(GRUPOS_SISBEN, { error: "Seleccione el grupo del Sisbén." }),
  estrato: z.enum(ESTRATOS, { error: "Seleccione el estrato socioeconómico." }),
  tiempo_experiencia_emprendimiento: z.enum(TIEMPOS_EXPERIENCIA, { error: "Seleccione el tiempo de experiencia." }),
  tipo_joven_emprendedor: z.enum(TIPOS_JOVEN_EMPRENDEDOR, { error: "Seleccione el tipo de joven emprendedor." }),
  no_apoyo_gobernacion_ultimos_2_anios: z.boolean().refine((value) => value, "Debe confirmar que no ha recibido este apoyo."),
  no_beneficiario_programa_estado: z.boolean().refine((value) => value, "Debe confirmar que no es beneficiario de estos programas."),
});

export type JovenEmprendedorInput = z.infer<typeof jovenEmprendedorSchema>;
