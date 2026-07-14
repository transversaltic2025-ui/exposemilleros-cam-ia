-- Ejecutar una sola vez en Supabase antes de desplegar el módulo de edición.
alter table public.proyectos
  add column if not exists actualizado_por_documento text,
  add column if not exists actualizado_at timestamptz;

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
-- No se crean políticas públicas: las APIs acceden exclusivamente con service role.
