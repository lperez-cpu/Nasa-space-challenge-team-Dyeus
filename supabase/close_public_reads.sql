-- Project E.D.E.N. · Cierra la LECTURA sin sesión (anon) de los datos privados.
-- Decisión del equipo (2026-11-15): login obligatorio por privacidad de los datos biométricos.
-- Se mantiene para anon: leer el catálogo de plantas, enviar solicitudes de acceso
-- y la INSERCIÓN en astronaut_log (puente del Arduino, hardware/bridge.py).
-- Reversible: volver a crear las políticas "… select anon" con using (true).

-- Datos biométricos
drop policy if exists "anon select astronaut_log" on astronaut_log;
drop policy if exists "astronaut_log_select_anon" on astronaut_log;

-- Historial de dispensados
drop policy if exists "anon select dispense_log" on dispense_log;
drop policy if exists "dispense_log_select_anon" on dispense_log;

-- Bóveda de Seed Pods: solo con sesión
drop policy if exists "anon select seed_cartridges" on seed_cartridges;
drop policy if exists "seed_cartridges_select_anon" on seed_cartridges;
drop policy if exists "seed_cartridges_read" on seed_cartridges;
create policy "seed_cartridges_read" on seed_cartridges for select to authenticated using (true);
