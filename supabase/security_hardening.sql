-- Project E.D.E.N. — Endurecimiento de seguridad (idempotente). Ejecutar DESPUÉS de auth_roles_setup.sql
-- y close_public_reads.sql, en Supabase → SQL Editor.
--
-- 1. Sin sesión (clave anon) solo se puede: leer `plants`, enviar `access_requests` (pending) e insertar
--    lecturas en `astronaut_log` SIN dueño (puente del Arduino). Se cierran las escrituras anon que
--    quedaban en seed_cartridges y dispense_log, y anon ya no puede adjuntar lecturas a un astronauta.
-- 2. Con sesión pero SIN rol en user_profiles: no ve ni toca pods ni el historial de extracciones.
-- 3. Defensa en profundidad: anon pierde los privilegios de escritura de tabla que no usa, y nadie
--    tiene TRUNCATE/TRIGGER/REFERENCES (TRUNCATE no pasa por RLS).
-- Depende de public.has_role(text[]) (security definer, ver auth_roles_setup.sql).

-- ── 1. Escrituras sin sesión ─────────────────────────────────────────────
drop policy if exists "seed_cartridges_extract_anon" on seed_cartridges;
drop policy if exists "dispense_log_insert_anon" on dispense_log;

drop policy if exists "anon insert astronaut_log" on astronaut_log;      -- duplicada
drop policy if exists "astronaut_log_insert_anon" on astronaut_log;
create policy "astronaut_log_insert_anon" on astronaut_log for insert to anon
  with check (user_id is null);                                           -- lecturas del puente, sin dueño

drop policy if exists "anon select plants" on plants;                     -- duplicada de plants_select_anon

revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
grant insert on access_requests, astronaut_log to anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- ── 2. Sesión sin rol: nada ──────────────────────────────────────────────
drop policy if exists "seed_cartridges_read" on seed_cartridges;
create policy "seed_cartridges_read" on seed_cartridges for select to authenticated
  using (public.has_role(array['paciente','doctor','programador','admin']));

drop policy if exists "seed_cartridges_extract_authenticated" on seed_cartridges;
create policy "seed_cartridges_extract_authenticated" on seed_cartridges for update to authenticated
  using (status = 'ready' and public.has_role(array['paciente','doctor','programador','admin']))
  with check (status = 'growing');

drop policy if exists "dispense_log_select_authenticated" on dispense_log;
create policy "dispense_log_select_authenticated" on dispense_log for select to authenticated
  using (public.has_role(array['paciente','doctor','programador','admin']));

drop policy if exists "dispense_log_insert_authenticated" on dispense_log;
create policy "dispense_log_insert_authenticated" on dispense_log for insert to authenticated
  with check (plant_id is not null and public.has_role(array['paciente','doctor','programador','admin']));
