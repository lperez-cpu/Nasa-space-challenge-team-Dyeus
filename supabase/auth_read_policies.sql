-- Project E.D.E.N. · Lectura para usuarios con sesión (rol authenticated). Aditivo: no toca las políticas de anon.
drop policy if exists "plants_select_authenticated" on plants;
create policy "plants_select_authenticated" on plants for select to authenticated using (true);

drop policy if exists "dispense_log_select_authenticated" on dispense_log;
create policy "dispense_log_select_authenticated" on dispense_log for select to authenticated using (true);

drop policy if exists "astronaut_log_engineer_read" on astronaut_log;
create policy "astronaut_log_engineer_read" on astronaut_log for select to authenticated
  using (public.has_role(array['programador']));
