export type ProductorIniciativa = {
  id: string;
  codigo_iniciativa: string;
  nombre_productor: string;
  documento: string;
  celular: string;
  municipio: string;
  vereda?: string | null;
  nombre_iniciativa: string;
  anio_inicio: number;
  linea_productiva: string;
  linea_productiva_otro?: string | null;
  descripcion_iniciativa: string;
  producto_servicio: string;
  nivel_madurez: string;
  productos_obtenidos: string[];
  productos_obtenidos_otro?: string | null;
  donde_vende: string[];
  donde_vende_otro?: string | null;
  principal_dificultad: string[];
  principal_dificultad_otro?: string | null;
  estado_analisis_ia?: string;
  created_at?: string;
};

export type EvaluadoraProductores = {
  id: string;
  nombre_completo: string;
  documento: string;
  correo?: string | null;
  activo: boolean;
  created_at?: string;
};
