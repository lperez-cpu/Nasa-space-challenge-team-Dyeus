-- Project E.D.E.N. — Alta de usuarios: cada cuenta nueva de Supabase Auth recibe su fila en user_profiles.
-- Idempotente. Ejecutar en Supabase → SQL Editor.
--
-- - Registro propio (pestaña "New User", api.signUpCrew): el rol es SIEMPRE 'paciente'.
--   El trigger ignora cualquier "role" que el cliente mande en la metadata: nadie se da un rol a sí mismo.
-- - Alta por Admin (MOD-06, api.provisionUserAccount): la Edge Function `provision-user` crea la cuenta
--   (este trigger deja 'paciente') y luego fija el rol elegido con service_role, del lado del servidor.
-- - user_profiles no tiene política UPDATE: ningún usuario puede cambiar su propio rol.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, role, full_name)
  values (
    new.id,
    'paciente',
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
