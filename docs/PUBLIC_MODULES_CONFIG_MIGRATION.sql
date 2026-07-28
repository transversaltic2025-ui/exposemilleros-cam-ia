insert into public.sistema_configuracion (clave, valor)
values
  ('inscripcion_proyectos_habilitada', 'true'),
  ('edicion_inscripciones_habilitada', 'true'),
  ('registro_evaluadores_habilitado', 'true'),
  ('productores_inscripcion_habilitada', 'true'),
  ('jovenes_emprendedores_inscripcion_habilitada', 'true')
on conflict (clave) do nothing;
