-- Project E.D.E.N. · Plants NASA has grown on the ISS (Veggie / Advanced Plant Habitat).
-- Applied on 2026-11-15 (ids 32-36). Source: https://www.nasa.gov/missions/station/so-you-want-to-be-a-space-farmer/
-- grow_time_days: 137 (chile, PH-04) and 33 (lettuce, VEG-01) are NASA figures; the rest are approximate.
-- Zinnia's condition avoids the word 'stress' on purpose so stress alerts keep prescribing Ashwagandha.

insert into plants (plant_name, latin_name, condition, active_compound, dose, grow_time_days, effect, nasa_backed, evidence) values
 ('Hatch Chile', 'Capsicum annuum', 'Vitamin C deficiency, immune support', 'Vitamin C, capsaicin', '1 fresh pepper (~45 g) daily', 137, 'Antioxidant and immune support', true,
  'NASA Plant Habitat-04 (APH): Hatch chile peppers grown on the ISS for 137 days in 2021'),
 ('Kale', 'Brassica oleracea', 'Bone density loss, vitamin K deficiency', 'Vitamin K1, calcium', '30 g fresh leaves daily', 30, 'Supports bone health', true,
  'NASA Veggie: Red Russian kale grown and eaten on the ISS'),
 ('Red Romaine Lettuce', 'Lactuca sativa ''Outredgeous''', 'Low dietary fiber, gut health', 'Dietary fiber, anthocyanins', '1 serving (~50 g) fresh leaves daily', 33, 'Fresh fiber to complement packaged space food', true,
  'NASA Veggie (VEG-01): first space-grown lettuce eaten by astronauts on the ISS, 2015'),
 ('Pak Choi', 'Brassica rapa subsp. chinensis', 'Vision support (SANS), vitamin A deficiency', 'Beta-carotene, lutein', '30 g fresh leaves daily', 30, 'Nutritional support for the eyes', true,
  'NASA Veggie: Extra Dwarf pak choi grown on the ISS'),
 ('Zinnia', 'Zinnia hybrida', 'Low mood, isolation', 'Horticultural therapy (not eaten)', 'Daily plant care (~30 min)', 60, 'Psychological benefit of tending a living plant', true,
  'NASA Veggie: zinnias grown and cared for by astronaut Scott Kelly on the ISS, 2016')
;
