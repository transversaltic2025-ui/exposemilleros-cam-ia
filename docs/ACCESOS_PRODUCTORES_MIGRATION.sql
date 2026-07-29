create extension if not exists pgcrypto;

create table if not exists public.accesos_productores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  documento text unique not null,
  correo text,
  clave_hash text not null,
  token_acceso text unique,
  activo boolean not null default true,
  ultimo_acceso timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accesos_productores_token_idx
  on public.accesos_productores (token_acceso);

alter table public.accesos_productores enable row level security;

-- No se crean políticas públicas. El servidor accede con SUPABASE_SERVICE_ROLE_KEY.
