-- Project E.D.E.N. · Permite que la app marque un Seed Pod como "growing" al extraerlo.
-- La clave pública (anon) solo puede cambiar status y planted_at, y solo de "ready" a "growing".
-- Pegar en Supabase → SQL Editor → Run.

revoke update on seed_cartridges from anon;
grant update (status, planted_at) on seed_cartridges to anon;

drop policy if exists "seed_cartridges_extract_anon" on seed_cartridges;
create policy "seed_cartridges_extract_anon" on seed_cartridges
  for update to anon
  using (status = 'ready')
  with check (status = 'growing');
