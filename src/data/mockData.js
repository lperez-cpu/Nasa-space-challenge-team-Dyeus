// Fallback demo data used only when Supabase env vars are missing or unreachable.

export const solutionData = {
  crew: { id: "CRW-07", name: "Mission Specialist", module: "HAB-2 / Bio-Lab" },

  // Dose rate measured by Curiosity's RAD instrument during Earth–Mars cruise (~1.84 mSv/day).
  radiation: { rateMsvPerDay: 1.84, source: "MSL/RAD · Earth–Mars cruise" },

  prescriptions: [
    {
      id: "rx-ashwagandha",
      plant: "Ashwagandha",
      latin: "Withania somnifera",
      trigger: "High Cortisol",
      triggerValue: "28.4 µg/dL",
      effect: "Adaptogen · reduces stress and serum cortisol",
      compound: "Withanolides",
      dose: "600 mg/day root extract",
      harvestDays: 21,
      nasaBacked: false,
      evidence: "Earth clinical evidence (cortisol trials)",
    },
    {
      id: "rx-tomate-micro",
      plant: "Micro Tomato",
      latin: "Solanum lycopersicum (micro)",
      trigger: "Vitamin Deficiency",
      triggerValue: "Low Vit. C / Lycopene",
      effect: "Provides Vitamin C, K, and antioxidants",
      compound: "Lycopene · Vitamin C",
      dose: "1 serving (~50 g) daily",
      harvestDays: 28,
      nasaBacked: true,
      evidence: "Dwarf tomato grown on the ISS (Veggie VEG-05)",
    },
  ],

  seedVault: [
    {
      id: "cart-gen3",
      cartridge: "Gen-3 Cartridge",
      plant: "Ashwagandha",
      viability: 42,
      status: "rejected",
      label: "RADIATION DAMAGE (DISCARDED)",
      detail: "Double-strand breaks detected · stored unshielded",
      exposureDays: 410,
      shielding: 1.0,
    },
    {
      id: "cart-gen2",
      cartridge: "Gen-2 Cartridge",
      plant: "Ashwagandha",
      viability: 98,
      status: "approved",
      label: "DNA VERIFIED (AUTHORIZED)",
      detail: "Genomic integrity within tolerance · water-shielded vault",
      exposureDays: 410,
      shielding: 0.35,
      rxTag: "RX: ASHWAGANDHA GEN-2",
    },
  ],
};

export const missionData = {
  systemName: "PROJECT E.D.E.N.",
  mode: "DEEP SPACE MODE",
  earthDelay: "24m 12s",
  autonomyStatus: "100% AUTONOMOUS",
  missionId: "ARES-IV // TRANS-MARS CRUISE",
  missionDay: "SOL 148",
  distanceFromEarth: "217.4M KM",
};

export const astronautProfile = {
  id: "AST-04-VANCE",
  name: "Cmdr. Elena Vance",
  role: "Mission Commander & Flight Surgeon",
  vessel: "ISS / Deep Space Habitat // Veggie Bio-Bay",
  suitLink: "BIOSENSOR-LINK ACTIVE",
  bloodType: "O-",
  age: 38,
  evaHours: "142.5 HRS",
  lastSync: "14:22:08 UTC",
};

export const vitalSigns = {
  cortisol: {
    id: "cortisol",
    label: "Serum Cortisol",
    value: "28.4 µg/dL",
    numericValue: 28.4,
    unit: "µg/dL",
    referenceRange: "6.0 – 18.4 µg/dL",
    status: "HIGH",
    alertTitle: "High Cortisol (Chronic Stress)",
    alertDetail: "Sustained elevation +54% above nominal flight threshold.",
  },
  vitamins: {
    id: "vitamins",
    label: "Vitamin Index (C / D3 / B12)",
    value: "34%",
    numericValue: 34,
    unit: "%",
    referenceRange: "75% – 100%",
    status: "CRITICAL",
    alertTitle: "Vitamin Deficiency",
    alertDetail: "Severe depletion detected. Immune and bone density risk.",
  },
  heartRate: {
    id: "heartRate",
    label: "Heart Rate",
    value: "96 BPM",
    referenceRange: "60 – 85 BPM",
    status: "ELEVATED",
  },
  spo2: {
    id: "spo2",
    label: "Blood Oxygen (SpO₂)",
    value: "98%",
    referenceRange: "95% – 100%",
    status: "NOMINAL",
  },
  radiationDose: {
    id: "radiationDose",
    label: "Cumulative Radiation",
    value: "272.3 mSv",
    referenceRange: "< 600 mSv",
    status: "NOMINAL",
  },
  circadianDrift: {
    id: "circadianDrift",
    label: "Circadian Drift",
    value: "+1.8 hrs",
    referenceRange: "±0.5 hrs",
    status: "ELEVATED",
  },
};
