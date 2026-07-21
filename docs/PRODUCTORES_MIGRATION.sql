create extension if not exists pgcrypto;

create table if not exists public.productores_iniciativas (
  id uuid primary key default gen_random_uuid(), codigo_iniciativa text unique not null,
  nombre_productor text not null, documento text not null, celular text not null,
  municipio text not null, vereda text not null, nombre_iniciativa text not null,
  anio_inicio integer not null check (anio_inicio between 1950 and 2026),
  linea_productiva text not null, linea_productiva_otro text, descripcion text not null,
  producto_servicio text not null, nivel_madurez text not null,
  productos_obtenidos jsonb not null default '[]', productos_obtenidos_otro text,
  lugares_venta jsonb not null default '[]', lugar_venta_otro text,
  dificultades jsonb not null default '[]', dificultad_otro text,
  estado_analisis_ia text not null default 'Pendiente', created_at timestamptz not null default now()
);
create table if not exists public.evaluadoras_productores (
  id uuid primary key default gen_random_uuid(), nombre_completo text not null,
  documento text unique not null, correo text, activo boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.evaluaciones_productores (
  id uuid primary key default gen_random_uuid(), iniciativa_id uuid not null references public.productores_iniciativas(id) on delete cascade,
  evaluadora_id uuid not null references public.evaluadoras_productores(id), claridad_iniciativa integer not null check (claridad_iniciativa between 1 and 5),
  viabilidad_productiva integer not null check (viabilidad_productiva between 1 and 5), potencial_comercial integer not null check (potencial_comercial between 1 and 5),
  madurez_productiva integer not null check (madurez_productiva between 1 and 5), pertinencia_territorial integer not null check (pertinencia_territorial between 1 and 5),
  fortalezas text not null, aspectos_mejorar text not null, apoyo_recomendado text not null, concepto_evaluadora text not null,
  puntaje_total integer not null, promedio numeric(4,2) not null, porcentaje numeric(5,2) not null, nivel_tendencia text not null,
  created_at timestamptz not null default now(), unique(iniciativa_id, evaluadora_id)
);
create table if not exists public.analisis_ia_productores (
  id uuid primary key default gen_random_uuid(), iniciativa_id uuid unique not null references public.productores_iniciativas(id) on delete cascade,
  resumen_ia text, linea_productiva_detectada text, nivel_madurez_ia text, potencial_comercial_ia text,
  riesgos_detectados jsonb default '[]', oportunidades_detectadas jsonb default '[]', necesidades_fortalecimiento jsonb default '[]',
  recomendaciones_ia jsonb default '[]', tendencias_relacionadas jsonb default '[]', prioridad_acompanamiento text,
  puntaje_sugerido_ia numeric(5,2), porcentaje_ia numeric(5,2), nivel_tendencia_ia text,
  modelo_ia text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.productores_iniciativas enable row level security;
alter table public.evaluadoras_productores enable row level security;
alter table public.evaluaciones_productores enable row level security;
alter table public.analisis_ia_productores enable row level security;
