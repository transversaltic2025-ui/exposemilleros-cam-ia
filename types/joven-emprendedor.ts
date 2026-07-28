export interface JovenEmprendedor {
  id: string;
  codigo_registro: string;
  nombre_completo: string;
  documento: string;
  telefono: string;
  correo: string;
  edad: number;
  municipio_residencia: string;
  grupo_sisben: "A" | "B" | "C";
  estrato: "1" | "2" | "3";
  no_apoyo_gobernacion_ultimos_2_anios: boolean;
  no_beneficiario_programa_estado: boolean;
  tiempo_experiencia_emprendimiento: string;
  tipo_joven_emprendedor: string;
  estado_registro: string;
  created_at: string;
}
