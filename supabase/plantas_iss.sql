-- ============================================================
-- Project E.D.E.N. · Plantas cultivadas por la NASA en la ISS
-- Pegar en Supabase → SQL Editor → Run (proyecto byztvpnhkzfetarkcrcu).
--
-- Fuente (todas las plantas de abajo aparecen ahí):
--   https://www.nasa.gov/missions/station/so-you-want-to-be-a-space-farmer/
--
-- Cómo se usan:
--   • Si dos plantas tratan la MISMA condición, la app muestra la que tiene
--     nasa_backed = true. Por eso Chile Hatch reemplaza a Moringa en
--     "Déficit vitamina C" y Kale reemplaza a Albahaca en "Densidad ósea baja".
--   • Las condiciones NUEVAS (Microbioma alterado, Riesgo visual, Ánimo bajo)
--     aparecen cuando astronaut_log tenga una columna *_level con ese texto,
--     p. ej. gut_level = 'Microbioma alterado'.
--
-- grow_time_days: 137 (chile) y 27 (rábano) son los días que reporta la NASA;
-- el resto son tiempos de cosecha aproximados.
-- ============================================================

insert into plants
  (condition, plant_name, latin_name, active_compound, dose, grow_time_days, effect, nasa_backed, evidence)
values
  ('Déficit vitamina C', 'Chile Hatch', 'Capsicum annuum', 'Vitamina C (ácido ascórbico)',
   '1 chile fresco (~45 g)', 137, 'Inmunidad y antioxidantes', true,
   'NASA Plant Habitat-04 (APH): chiles cultivados 137 días en la ISS, el experimento de plantas más largo en el espacio'),

  ('Densidad ósea baja', 'Kale', 'Brassica oleracea', 'Vitamina K + calcio',
   '30 g hojas frescas', 30, 'Soporte óseo', true,
   'NASA Veggie: kale cultivado en la ISS'),

  ('Microbioma alterado', 'Lechuga roja Outredgeous', 'Lactuca sativa', 'Fibra dietética',
   '1 porción (~50 g) hojas frescas', 30, 'Restaura la flora intestinal tras la comida deshidratada', true,
   'NASA Veggie: primera lechuga cultivada y comida en el espacio'),

  ('Riesgo visual (SANS)', 'Pak choi', 'Brassica rapa subsp. chinensis', 'Luteína + vitamina A',
   '30 g hojas frescas', 30, 'Protección de la retina', true,
   'NASA Veggie: pak choi Extra Dwarf cultivado y trasplantado en la ISS'),

  ('Ánimo bajo / aislamiento', 'Zinnia (Green Time)', 'Zinnia hybrida', 'Terapia de horticultura',
   '30 min/día cuidando el cultivo', 60, 'Reduce el estrés psicológico del aislamiento', true,
   'NASA Veggie: zinnias cuidadas por el astronauta Scott Kelly en la ISS');

-- Rábano (Plant Habitat-02, 27 días) también está documentado por la NASA;
-- se puede agregar cuando definan qué condición trata.
