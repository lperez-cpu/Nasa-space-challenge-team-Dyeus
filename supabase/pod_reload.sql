-- Project E.D.E.N. — Seed Pods reutilizables (idempotente). Ejecutar en Supabase → SQL Editor.
--
-- Un Seed Pod es un cartucho reutilizable: después de extraerlo y cultivarlo, el tripulante lo recarga
-- con semillas de la bóveda y vuelve a quedar "ready" en el dispensador.
-- La app llama a esta función (api.reloadPod → POST /rest/v1/rpc/reload_pod). Solo cuentas con rol
-- (paciente, doctor, programador, admin); sin sesión no se puede. No cambia nada más del pod.

create or replace function public.reload_pod(p_pod_id text)
returns table (pod_id text, status text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(array['paciente', 'doctor', 'programador', 'admin']) then
    raise exception 'A crew role is required to reload a Seed Pod.' using errcode = '42501';
  end if;
  return query
    update public.seed_cartridges c
       set status = 'ready', planted_at = null
     where c.pod_id = p_pod_id and c.status <> 'ready'
    returning c.pod_id, c.status;
end;
$$;

revoke execute on function public.reload_pod(text) from public, anon;
grant execute on function public.reload_pod(text) to authenticated;
