create table if not exists public.jovenes_emprendedores (
  id uuid primary key default gen_random_uuid(),
  codigo_registro text not null unique,
  nombre_completo text not null,
  documento text not null,
  telefono text not null,
  correo text not null,
  edad integer not null check (edad between 18 and 28),
  municipio_residencia text not null,
  grupo_sisben text not null check (grupo_sisben in ('A', 'B', 'C')),
  estrato text not null check (estrato in ('1', '2', '3')),
  no_apoyo_gobernacion_ultimos_2_anios boolean not null,
  no_beneficiario_programa_estado boolean not null,
  tiempo_experiencia_emprendimiento text not null,
  tipo_joven_emprendedor text not null,
  estado_registro text not null default 'Registrado',
  created_at timestamptz not null default now()
);

create index if not exists jovenes_emprendedores_created_at_idx
  on public.jovenes_emprendedores (created_at desc);
