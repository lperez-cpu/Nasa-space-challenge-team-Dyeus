-- ============================================================
-- Bio-Sync OS · Esquema PROPUESTO para Supabase
-- Pegar en Supabase → SQL Editor → Run.
--
-- Si ya tienes tus tablas con otros nombres de columnas, no pasa nada:
-- solo hay que ajustar las funciones map*() en src/data/api.js.
-- ============================================================

-- Configuración de la misión (una sola fila)
create table if not exists mission_config (
  id               int primary key default 1,
  crew_id          text,
  crew_name        text,
  crew_module      text,
  rate_msv_per_day numeric not null,       -- tasa de radiación (dato NASA)
  radiation_source text
);

-- Base de datos de la "farmacia viva" (la tabla de 10-15 filas del plan)
create table if not exists prescriptions (
  id               text primary key,
  condition        text not null,          -- condición detectada
  trigger_value    text,                   -- valor que disparó la alerta
  plant            text not null,          -- planta recomendada
  latin_name       text,
  effect           text,
  active_compound  text,                   -- compuesto activo
  dose             text,                   -- dosis
  harvest_days     int,                    -- tiempo de cultivo en microgravedad
  nasa_backed      boolean default false,  -- datos NASA de respaldo (sí/no)
  evidence         text,
  active           boolean default true,   -- true = se muestra como receta activa
  sort             int default 0
);

-- Cartuchos del banco de semillas (auditoría genética)
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

-- Registro de cada vez que se dispensa un cartucho (lo escribe el botón)
create table if not exists dispense_log (
  id            bigint generated always as identity primary key,
  cartridge_id  text references seed_cartridges(id),
  dispensed_at  timestamptz default now()
);

-- ── Seguridad (RLS): el frontend usa la clave pública ────────────────
-- Lectura pública en las tablas de datos, solo inserción en el log.
alter table mission_config  enable row level security;
alter table prescriptions   enable row level security;
alter table seed_cartridges enable row level security;
alter table dispense_log    enable row level security;

create policy "lectura publica" on mission_config  for select using (true);
create policy "lectura publica" on prescriptions   for select using (true);
create policy "lectura publica" on seed_cartridges for select using (true);
create policy "insertar log"    on dispense_log    for insert with check (true);

-- ── Datos iniciales (los mismos de la demo) ─────────────────────────
insert into mission_config values
  (1, 'CRW-07', 'Especialista de Misión', 'HAB-2 / Bio-Lab', 1.84, 'MSL/RAD · crucero Tierra–Marte')
on conflict (id) do nothing;

insert into prescriptions
  (id, condition, trigger_value, plant, latin_name, effect, active_compound, dose, harvest_days, nasa_backed, evidence, active, sort)
values
  ('rx-ashwagandha', 'Cortisol Alto', '28.4 µg/dL', 'Ashwagandha', 'Withania somnifera',
   'Adaptógeno · reduce estrés y cortisol', 'Withanólidos', '600 mg/día extracto de raíz', 21, false,
   'Evidencia clínica en Tierra (ensayos sobre cortisol)', true, 1),
  ('rx-tomate-micro', 'Déficit Vitamínico', 'Vit. C / Licopeno bajos', 'Tomate Micro', 'Solanum lycopersicum (micro)',
   'Aporte de vitamina C, K y antioxidantes', 'Licopeno · Vitamina C', '1 porción (~50 g) diaria', 28, true,
   'Tomate enano cultivado en la ISS (Veggie VEG-05)', true, 2)
on conflict (id) do nothing;

insert into seed_cartridges
  (id, cartridge, plant, viability, status, label, detail, exposure_days, shielding, rx_tag, sort)
values
  ('cart-gen3', 'Cartucho Gen-3', 'Ashwagandha', 42, 'rejected', 'DAÑO POR RADIACIÓN (DESCARTADO)',
   'Roturas de doble cadena detectadas · almacenado sin blindaje', 410, 1.0, null, 1),
  ('cart-gen2', 'Cartucho Gen-2', 'Ashwagandha', 98, 'approved', 'ADN VERIFICADO (AUTORIZADO)',
   'Integridad genómica dentro de tolerancia · bóveda con blindaje de agua', 410, 0.35, 'RX: ASHWAGANDHA GEN-2', 2)
on conflict (id) do nothing;
