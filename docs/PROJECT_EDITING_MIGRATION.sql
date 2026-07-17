-- Ejecutar una sola vez en Supabase antes de desplegar el módulo de edición.
alter table public.proyectos
  add column if not exists actualizado_por_documento text,
  add column if not exists actualizado_at timestamptz,
  add column if not exists poster_actualizado_at timestamptz,
  add column if not exists poster_actualizado_por_documento text;

create table if not exists public.proyecto_ediciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  codigo_proyecto text not null,
  documento_solicitante text not null,
  tipo_edicion text not null default 'Actualización de inscripción',
  datos_anteriores jsonb not null,
  datos_nuevos jsonb not null,
  observacion text,
  created_at timestamptz not null default now()
);

create index if not exists proyecto_ediciones_proyecto_id_created_at_idx
  on public.proyecto_ediciones (proyecto_id, created_at desc);

alter table public.proyecto_ediciones enable row level security;
-- Configuración operativa administrada exclusivamente mediante APIs con service role.
create table if not exists public.sistema_configuracion (
  clave text primary key,
  valor text not null,
  descripcion text,
  updated_at timestamptz not null default now()
);

insert into public.sistema_configuracion (clave, valor, descripcion)
values ('edicion_inscripciones_habilitada', 'false', 'Controla la edición pública de inscripciones de proyectos.')
on conflict (clave) do nothing;

insert into public.sistema_configuracion (clave, valor, descripcion)
values
  ('inscripcion_proyectos_habilitada', 'false', 'Controla la inscripción pública de proyectos.'),
  ('registro_evaluadores_habilitado', 'false', 'Controla el registro público de evaluadores.')
on conflict (clave) do nothing;

alter table public.sistema_configuracion enable row level security;
-- No se crean políticas públicas: las APIs acceden exclusivamente con service role.
