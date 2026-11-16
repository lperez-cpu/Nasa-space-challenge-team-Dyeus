-- Project E.D.E.N. — Tripulación demo para los jueces (idempotente en nombres y métricas).
-- Mismas cuentas que administra la base de datos del equipo: astronaut1-3, doctor, progra, admin.
-- Cada astronauta tiene talla, masa y registros de salud propios (datos simulados), así cada cuenta
-- ve su propia dashboard. Las cuentas se crean en Authentication (no aquí).

update public.user_profiles p set full_name = v.name
  from (values ('doctor@eden.space', 'Dra. Elena Voss'), ('progra@eden.space', 'Dev Dyeus'),
               ('admin@eden.space', 'Admin Dyeus')) v(email, name), auth.users u
 where u.email = v.email and p.id = u.id;

update public.user_profiles p set height_cm = v.h, body_mass_kg = v.m
  from (values ('astronaut1@eden.space', 168, 61), ('astronaut2@eden.space', 181, 84),
               ('astronaut3@eden.space', 175, 72)) v(email, h, m), auth.users u
 where u.email = v.email and p.id = u.id;

-- Registros de salud simulados (solo si el astronauta aún no tiene).
insert into public.astronaut_log (user_id, created_at, heart_rate, sleep_quality, energy_level, mood, days_in_space,
  symptoms, stress_level, inflammation_level, cognitive_level, cardiovascular_level, nutrition_level)
select u.id, now() - (v.hours_ago || ' hours')::interval, v.hr, v.sleep, v.energy, v.mood, v.days, v.symptoms,
       v.stress, v.inflam, v.cog, v.cardio, v.nutri
  from (values
    -- astronaut1: estrés alto y sueño pobre
    ('astronaut1@eden.space', 30, 84, 6, 6, 6, 283, array['insomnia'], 'MOD', 'LOW', 'LOW', 'NORMAL', 'Normal'),
    ('astronaut1@eden.space',  2, 94, 4, 4, 5, 284, array['insomnia','anxiety','headache'], 'HIGH', 'LOW', 'MOD', 'NORMAL', 'Normal'),
    -- astronaut2: inflamación y carga cardiovascular
    ('astronaut2@eden.space', 30, 80, 7, 6, 7, 149, array['muscle soreness'], 'LOW', 'MOD', 'LOW', 'NORMAL', 'Normal'),
    ('astronaut2@eden.space',  2, 88, 6, 5, 6, 150, array['muscle soreness','joint pain'], 'LOW', 'HIGH', 'LOW', 'MOD', 'MOD'),
    -- astronaut3: estable
    ('astronaut3@eden.space', 30, 64, 8, 8, 8, 59, array[]::text[], 'LOW', 'LOW', 'LOW', 'NORMAL', 'Normal'),
    ('astronaut3@eden.space',  2, 66, 8, 8, 8, 60, array[]::text[], 'LOW', 'LOW', 'LOW', 'NORMAL', 'Normal')
  ) v(email, hours_ago, hr, sleep, energy, mood, days, symptoms, stress, inflam, cog, cardio, nutri)
  join auth.users u on u.email = v.email
 where not exists (select 1 from public.astronaut_log l where l.user_id = u.id);
