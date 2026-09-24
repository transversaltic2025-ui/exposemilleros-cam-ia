-- Ejecutar en Supabase SQL Editor antes de usar el módulo.
begin;
alter table public.certificados
  add column if not exists certificado_firmado_path text,
  add column if not exists certificado_firmado_nombre text,
  add column if not exists certificado_firmado_tipo text,
  add column if not exists certificado_firmado_size bigint,
  add column if not exists certificado_firmado_at timestamptz,
  add column if not exists certificado_firmado_subido_por text,
  add column if not exists estado_firma text default 'Pendiente de firma',
  add column if not exists documento_normalizado text generated always as
    (regexp_replace(coalesce(documento_persona::text, ''), '[^0-9]', '', 'g')) stored;
create index if not exists certificados_documento_normalizado_idx on public.certificados(documento_normalizado);
create table if not exists public.certificados_firma_errores (
  id uuid primary key default gen_random_uuid(),
  archivo text not null,
  documento text not null default '',
  motivo text not null,
  resuelto boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.certificados_firma_errores enable row level security;
revoke all on public.certificados_firma_errores from anon, authenticated;
grant all on public.certificados_firma_errores to service_role;
-- La consulta pública pasa exclusivamente por la API de Next.js.
alter table public.certificados enable row level security;
revoke select on public.certificados from anon, authenticated;
update storage.buckets set public = false where id = 'certificates';
-- Políticas restrictivas: las políticas permisivas previas no deben permitir
-- leer o alterar certificados con claves públicas. service_role no usa RLS.
drop policy if exists certificates_server_only on storage.objects;
create policy certificates_server_only on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'certificates') with check (bucket_id <> 'certificates');
commit;
