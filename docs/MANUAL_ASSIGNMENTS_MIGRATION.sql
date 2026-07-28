-- Ejecutar una sola vez en Supabase antes de usar el módulo de asignación manual.
alter table public.proyectos
  add column if not exists requiere_asignacion_manual boolean not null default false,
  add column if not exists cupo_evaluadores_manual integer not null default 2,
  add column if not exists observaciones_asignacion_manual text;

alter table public.asignaciones
  add column if not exists tipo_asignacion text not null default 'Automática',
  add column if not exists asignado_por_admin boolean not null default false;

alter table public.proyectos
  drop constraint if exists proyectos_cupo_evaluadores_manual_check;
alter table public.proyectos
  add constraint proyectos_cupo_evaluadores_manual_check
  check (cupo_evaluadores_manual between 1 and 4);

create unique index if not exists asignaciones_proyecto_evaluador_unique
  on public.asignaciones (proyecto_id, evaluador_id);
