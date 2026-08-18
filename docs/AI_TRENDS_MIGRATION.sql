-- ExpoSemilleros CAM IA - ampliación del análisis de tendencias y género.
alter table public.analisis_ia
  add column if not exists mujeres_involucradas_ia text,
  add column if not exists mujeres_en_formulacion_ia text,
  add column if not exists mujeres_en_ejecucion_ia text,
  add column if not exists evidencia_genero_ia text,
  add column if not exists brechas_genero_ia text[] default '{}',
  add column if not exists acciones_genero_recomendadas_ia text[] default '{}';

create index if not exists analisis_ia_proyecto_fecha_idx
  on public.analisis_ia (proyecto_id, fecha_analisis desc);

comment on column public.analisis_ia.evidencia_genero_ia is
  'Evidencia textual explícita; nunca inferida a partir de nombres u otros datos personales.';
