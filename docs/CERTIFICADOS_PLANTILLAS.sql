create table if not exists public.certificados_plantillas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo_certificado text not null,
  bucket text not null default 'certificates',
  archivo_path text not null,
  archivo_nombre text not null,
  archivo_tipo text not null,
  archivo_size bigint not null,
  activo boolean not null default false,
  posiciones jsonb not null default '{"nombre":{"x":420,"y":395,"size":28,"maxWidth":720,"align":"center"},"documento":{"x":505,"y":365,"size":14,"maxWidth":220,"align":"left"},"rol":{"x":315,"y":318,"size":18,"maxWidth":220,"align":"center"}}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists certificados_plantillas_unica_activa_por_tipo_idx
  on public.certificados_plantillas (tipo_certificado) where activo = true;

update public.certificados_plantillas
set posiciones = jsonb_build_object(
  'nombre', coalesce(posiciones->'nombre', '{"x":420,"y":395,"size":28,"maxWidth":720,"align":"center"}'::jsonb),
  'documento', coalesce(posiciones->'documento', '{"x":505,"y":365,"size":14,"maxWidth":220,"align":"left"}'::jsonb),
  'rol', coalesce(posiciones->'rol', '{"x":315,"y":318,"size":18,"maxWidth":220,"align":"center"}'::jsonb)
)
where posiciones->'nombre' is null or posiciones->'documento' is null or posiciones->'rol' is null;

update public.certificados_plantillas
set posiciones = '{"nombre":{"x":420,"y":395,"size":28,"maxWidth":720,"align":"center"},"documento":{"x":505,"y":365,"size":14,"maxWidth":220,"align":"left"},"rol":{"x":315,"y":318,"size":18,"maxWidth":220,"align":"center"}}'::jsonb
where posiciones @> '{"nombre":{"x":420,"y":390,"size":28,"maxWidth":700},"documento":{"x":420,"y":360,"size":15,"maxWidth":500},"rol":{"x":420,"y":295,"size":18,"maxWidth":260}}'::jsonb;
