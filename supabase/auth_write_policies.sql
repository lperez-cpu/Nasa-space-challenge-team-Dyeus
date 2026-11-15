-- Project E.D.E.N. · Acceso Dual: escritura con sesión + columnas del formulario de solicitud. Aditivo.
-- (e) Columnas que usa el formulario "Request Access" (requested_role ya existe; la app mapea role_requested → requested_role)
alter table access_requests add column if not exists full_name text;
alter table access_requests add column if not exists reason text;
-- Las solicitudes nuevas solo pueden entrar como "pending" (antes: with check true → se podía insertar "approved")
drop policy if exists "access_requests_insert" on access_requests;
create policy "access_requests_insert" on access_requests for insert
  with check (coalesce(status, 'pending') = 'pending');

-- (d) Dispensar con sesión iniciada: registrar en dispense_log (con planta válida)…
drop policy if exists "dispense_log_insert_authenticated" on dispense_log;
create policy "dispense_log_insert_authenticated" on dispense_log for insert to authenticated
  with check (plant_id is not null);
-- …y marcar el pod como growing (solo ready → growing), igual que anon
drop policy if exists "seed_cartridges_extract_authenticated" on seed_cartridges;
create policy "seed_cartridges_extract_authenticated" on seed_cartridges for update to authenticated
  using (status = 'ready') with check (status = 'growing');
