-- ============================================================
-- Bio-Sync OS · Supabase
--
-- YA EXISTE (creada por backend): tabla `plants`
--   id, condition, plant_name, active_compound, dose, grow_time_days, effect
--   → src/data/api.js la lee y cruza `condition` con las alertas activas.
--
-- Lo de abajo es OPCIONAL: pegar en SQL Editor → Run para sumar funciones.
-- La app funciona sin esto (usa datos de demo para lo que falte).
-- ============================================================

-- 1) Columnas extra en `plants` (se muestran en la tarjeta si existen)
alter table plants add column if not exists latin_name  text;
alter table plants add column if not exists nasa_backed boolean default false;  -- "Datos NASA de respaldo (sí/no)"
alter table plants add column if not exists evidence    text;

update plants set latin_name = 'Withania somnifera', evidence = 'Evidencia clínica en Tierra (ensayos sobre cortisol)'
  where plant_name = 'Ashwagandha';
update plants set latin_name = 'Moringa oleifera', evidence = 'Evidencia nutricional en Tierra'
  where plant_name = 'Moringa';

-- 2) Cartuchos del banco de semillas (auditoría genética)
create table if not exists seed_cartridges (
  id             text primary key,
  cartridge      text not null,
  plant          text not null,
  viability      int not null check (viability between 0 and 100),
  status         text not null check (status in ('approved', 'rejected')),
  label          text,
  detail         text,
  exposure_days  int,
  shielding      numeric default 1.0,
  rx_tag         text,
  sort           int default 0
);

insert into seed_cartridges
  (id, cartridge, plant, viability, status, label, detail, exposure_days, shielding, rx_tag, sort)
values
  ('cart-gen3', 'Cartucho Gen-3', 'Ashwagandha', 42, 'rejected', 'DAÑO POR RADIACIÓN (DESCARTADO)',
   'Roturas de doble cadena detectadas · almacenado sin blindaje', 410, 1.0, null, 1),
  ('cart-gen2', 'Cartucho Gen-2', 'Ashwagandha', 98, 'approved', 'ADN VERIFICADO (AUTORIZADO)',
   'Integridad genómica dentro de tolerancia · bóveda con blindaje de agua', 410, 0.35, 'RX: ASHWAGANDHA GEN-2', 2)
on conflict (id) do nothing;

-- 3) Registro de cada vez que se pulsa "DISPENSAR CARTUCHO GEN-2"
create table if not exists dispense_log (
  id            bigint generated always as identity primary key,
  cartridge_id  text references seed_cartridges(id),
  dispensed_at  timestamptz default now()
);

-- Permisos para la clave pública (anon): leer cartuchos, solo insertar en el log
alter table seed_cartridges enable row level security;
alter table dispense_log    enable row level security;
create policy "lectura publica" on seed_cartridges for select using (true);
create policy "insertar log"    on dispense_log    for insert to anon with check (true);
