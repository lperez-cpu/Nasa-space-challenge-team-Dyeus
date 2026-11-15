-- ============================================================================
-- Project E.D.E.N. · Acceso Dual: perfiles, roles e inicio de sesión (Supabase Auth)
-- Proyecto activo: byztvpnhkzfetarkcrcu
--
-- ADITIVO e IDEMPOTENTE: se puede correr varias veces. NO borra ni modifica datos de
-- plants, seed_cartridges, astronaut_log ni dispense_log. El modo demo (anon) sigue igual.
-- Aplicado el 2026-11-15. Consolida fix_rls_recursion.sql, pod_status_update.sql,
-- auth_read_policies.sql y auth_write_policies.sql.
-- ============================================================================

-- 1) Tablas (solo se crean si no existen)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('paciente', 'doctor', 'programador', 'admin')),
  full_name text,
  created_at timestamptz default now()
);

create table if not exists access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  requested_role text not null,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table access_requests add column if not exists full_name text;
alter table access_requests add column if not exists reason text;
-- Alias de solo lectura con el nombre que usa el frontend (se escribe en requested_role)
alter table access_requests add column if not exists role_requested text generated always as (requested_role) stored;

create table if not exists profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid references auth.users(id),
  patient_id uuid references auth.users(id),
  viewed_at timestamptz default now()
);

alter table user_profiles   enable row level security;
alter table access_requests enable row level security;
alter table profile_views   enable row level security;

-- 2) Funciones de rol. SECURITY DEFINER leen user_profiles sin pasar por RLS
--    (evita el error "infinite recursion detected in policy for relation user_profiles").
create or replace function public.get_my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.user_profiles where id = auth.uid();
$$;

create or replace function public.has_role(roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_profiles where id = auth.uid() and role = any(roles));
$$;
revoke all on function public.has_role(text[]) from public;
grant execute on function public.has_role(text[]) to anon, authenticated;
grant execute on function public.get_my_role() to anon, authenticated;

-- 3) Perfiles: cada uno ve el suyo; doctor y admin ven todos. Nadie cambia su propio rol.
drop policy if exists "user_profiles_own" on user_profiles;
create policy "user_profiles_own" on user_profiles for select using (auth.uid() = id);
drop policy if exists "user_profiles_doctor_read" on user_profiles;
create policy "user_profiles_doctor_read" on user_profiles for select using (public.has_role(array['doctor','admin']));

-- 4) Solicitudes de acceso: cualquiera envía (solo "pending"); solo admin lee y aprueba.
drop policy if exists "access_requests_insert" on access_requests;
create policy "access_requests_insert" on access_requests for insert
  with check (coalesce(status, 'pending') = 'pending');
drop policy if exists "access_requests_admin" on access_requests;
create policy "access_requests_admin" on access_requests for all using (public.has_role(array['admin']));

-- 5) Vistas de perfil (auditoría): cada uno registra sus vistas; el paciente ve quién lo vio.
drop policy if exists "profile_views_insert" on profile_views;
create policy "profile_views_insert" on profile_views for insert with check (auth.uid() = viewer_id);
drop policy if exists "profile_views_own" on profile_views;
create policy "profile_views_own" on profile_views for select using (auth.uid() = patient_id);

-- 6) Datos de la misión con sesión iniciada (rol authenticated). Las políticas de anon no se tocan.
drop policy if exists "plants_select_authenticated" on plants;
create policy "plants_select_authenticated" on plants for select to authenticated using (true);
drop policy if exists "dispense_log_select_authenticated" on dispense_log;
create policy "dispense_log_select_authenticated" on dispense_log for select to authenticated using (true);
drop policy if exists "astronaut_log_doctor_read" on astronaut_log;
create policy "astronaut_log_doctor_read" on astronaut_log for select using (public.has_role(array['doctor','admin']));
drop policy if exists "astronaut_log_engineer_read" on astronaut_log;
create policy "astronaut_log_engineer_read" on astronaut_log for select to authenticated using (public.has_role(array['programador']));
drop policy if exists "dispense_log_insert_authenticated" on dispense_log;
create policy "dispense_log_insert_authenticated" on dispense_log for insert to authenticated with check (plant_id is not null);
drop policy if exists "seed_cartridges_write" on seed_cartridges;
create policy "seed_cartridges_write" on seed_cartridges for all using (public.has_role(array['doctor','admin','programador']));
drop policy if exists "seed_cartridges_extract_authenticated" on seed_cartridges;
create policy "seed_cartridges_extract_authenticated" on seed_cartridges for update to authenticated
  using (status = 'ready') with check (status = 'growing');

-- 7) Modo demo (anon): extraer un pod solo de ready → growing (columnas status y planted_at)
revoke update on seed_cartridges from anon;
grant update (status, planted_at) on seed_cartridges to anon;
drop policy if exists "seed_cartridges_extract_anon" on seed_cartridges;
create policy "seed_cartridges_extract_anon" on seed_cartridges for update to anon
  using (status = 'ready') with check (status = 'growing');

-- 8) Usuarios demo: se crean desde Supabase → Authentication (no por SQL) y luego:
--    insert into user_profiles (id, role, full_name) values ('<uuid>', 'doctor', 'Dr. EDEN')
--    on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;
--    Las contraseñas NUNCA van al repositorio ni a COORDINACION.md.
