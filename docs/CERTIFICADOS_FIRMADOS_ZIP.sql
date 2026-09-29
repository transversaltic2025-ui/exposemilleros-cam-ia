-- Ejecutar después de CERTIFICADOS_FIRMADOS.sql en Supabase SQL Editor.
begin;
create table if not exists public.certificados_firma_errores (
  id uuid primary key default gen_random_uuid(),
  archivo_nombre text not null,
  documento_detectado text,
  tipo_detectado text,
  certificado_id uuid references public.certificados(id) on delete set null,
  estado text not null default 'No asociado',
  motivo text not null,
  detalle_tecnico text,
  created_at timestamptz not null default now()
);
alter table public.certificados_firma_errores
  add column if not exists archivo_nombre text,
  add column if not exists documento_detectado text,
  add column if not exists tipo_detectado text,
  add column if not exists certificado_id uuid references public.certificados(id) on delete set null,
  add column if not exists estado text not null default 'No asociado',
  add column if not exists detalle_tecnico text;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'certificados_firma_errores' and column_name = 'archivo') then
    execute 'update public.certificados_firma_errores set archivo_nombre = coalesce(archivo_nombre, archivo), documento_detectado = coalesce(documento_detectado, documento), estado = case when resuelto then ''Resuelto'' else estado end';
    execute 'alter table public.certificados_firma_errores alter column archivo set default ''''';
  end if;
end $$;
alter table public.certificados_firma_errores enable row level security;
revoke all on public.certificados_firma_errores from anon, authenticated;
grant all on public.certificados_firma_errores to service_role;
create index if not exists certificados_firma_errores_estado_idx on public.certificados_firma_errores(estado, created_at desc);
-- Conservar los MIME anteriores del bucket de certificados.
update storage.buckets
set file_size_limit = greatest(coalesce(file_size_limit, 52428800), 52428800),
    allowed_mime_types = case when allowed_mime_types is null then null else
      array(select distinct unnest(allowed_mime_types || array['application/zip','application/x-zip-compressed','application/octet-stream','application/pdf'])) end
where id = 'certificates';
notify pgrst, 'reload schema';
commit;
