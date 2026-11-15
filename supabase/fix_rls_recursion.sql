-- IMPORTANTE: correr este archivo DESPUÉS de cualquier script que cree políticas con
-- 'EXISTS (SELECT 1 FROM user_profiles ...)'. Esas políticas causan
-- 'infinite recursion detected in policy for relation user_profiles' y la app deja de leer datos.

-- Project E.D.E.N. · Arreglo de "infinite recursion detected in policy for relation user_profiles"
-- Causa: políticas que consultan user_profiles DESDE una política de user_profiles.
-- Solución: una función security definer que lee el rol sin pasar por RLS.

create or replace function public.has_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_profiles where id = auth.uid() and role = any(roles));
$$;
revoke all on function public.has_role(text[]) from public;
grant execute on function public.has_role(text[]) to anon, authenticated;

drop policy if exists "user_profiles_doctor_read" on user_profiles;
create policy "user_profiles_doctor_read" on user_profiles
  for select using (public.has_role(array['doctor','admin']));

drop policy if exists "astronaut_log_doctor_read" on astronaut_log;
create policy "astronaut_log_doctor_read" on astronaut_log
  for select using (public.has_role(array['doctor','admin']));

drop policy if exists "seed_cartridges_write" on seed_cartridges;
create policy "seed_cartridges_write" on seed_cartridges
  for all using (public.has_role(array['doctor','admin','programador']));

drop policy if exists "access_requests_admin" on access_requests;
create policy "access_requests_admin" on access_requests
  for all using (public.has_role(array['admin']));

