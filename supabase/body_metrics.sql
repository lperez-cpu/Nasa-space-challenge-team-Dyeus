-- Project E.D.E.N. — Talla y masa corporal del tripulante (idempotente). Ejecutar en Supabase → SQL Editor.
--
-- Las porciones de cada planta se ajustan a la masa corporal (api.js: porción base × masa / 70 kg,
-- limitada entre 0,75× y 1,25×; es un modelo, no una dosis clínica). En la ISS la masa corporal se mide
-- con el SLAMMD (Space Linear Acceleration Mass Measurement Device), porque una balanza no funciona en
-- microgravedad. La administradora de la base carga estos valores en user_profiles (no hay política
-- UPDATE: un usuario no puede cambiarlos desde la app).

alter table public.user_profiles add column if not exists height_cm numeric(5,1);
alter table public.user_profiles add column if not exists body_mass_kg numeric(5,1);

alter table public.user_profiles drop constraint if exists user_profiles_height_cm_check;
alter table public.user_profiles add constraint user_profiles_height_cm_check
  check (height_cm is null or height_cm between 140 and 210);
alter table public.user_profiles drop constraint if exists user_profiles_body_mass_kg_check;
alter table public.user_profiles add constraint user_profiles_body_mass_kg_check
  check (body_mass_kg is null or body_mass_kg between 40 and 150);

comment on column public.user_profiles.height_cm is 'Talla en cm';
comment on column public.user_profiles.body_mass_kg is 'Masa corporal en kg (en órbita: SLAMMD)';

-- Valores del astronauta demo
update public.user_profiles set height_cm = 172, body_mass_kg = 68
 where role = 'paciente' and full_name = 'Astronaut EDEN';
