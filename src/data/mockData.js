// Datos temporales para previsualizar SolutionPanel.
// En el proyecto final se pueden reemplazar por datos reales de BiometricsPanel
// y pasarse como prop:  <SolutionPanel data={solutionData} />

export const solutionData = {
  crew: { id: "CRW-07", name: "Especialista de Misión", module: "HAB-2 / Bio-Lab" },

  // Tasa de dosis medida por el instrumento RAD del rover Curiosity durante el
  // crucero Tierra–Marte (~1.84 mSv/día, Zeitlin et al., Science 2013).
  radiation: { rateMsvPerDay: 1.84, source: "MSL/RAD · crucero Tierra–Marte" },

  // Columnas del plan: condición · planta · compuesto activo · dosis · tiempo de cultivo · respaldo NASA
  prescriptions: [
    {
      id: "rx-ashwagandha",
      plant: "Ashwagandha",
      latin: "Withania somnifera",
      trigger: "Cortisol Alto",
      triggerValue: "28.4 µg/dL",
      effect: "Adaptógeno · reduce estrés y cortisol",
      compound: "Withanólidos",
      dose: "600 mg/día extracto de raíz",
      harvestDays: 21,
      nasaBacked: false,
      evidence: "Evidencia clínica en Tierra (ensayos sobre cortisol)",
    },
    {
      id: "rx-tomate-micro",
      plant: "Tomate Micro",
      latin: "Solanum lycopersicum (micro)",
      trigger: "Déficit Vitamínico",
      triggerValue: "Vit. C / Licopeno bajos",
      effect: "Aporte de vitamina C, K y antioxidantes",
      compound: "Licopeno · Vitamina C",
      dose: "1 porción (~50 g) diaria",
      harvestDays: 28,
      nasaBacked: true,
      evidence: "Tomate enano cultivado en la ISS (Veggie VEG-05)",
    },
  ],

  // Dosis acumulada del cartucho = exposureDays × rateMsvPerDay × shielding
  seedVault: [
    {
      id: "cart-gen3",
      cartridge: "Cartucho Gen-3",
      plant: "Ashwagandha",
      viability: 42,
      status: "rejected",
      label: "DAÑO POR RADIACIÓN (DESCARTADO)",
      detail: "Roturas de doble cadena detectadas · almacenado sin blindaje",
      exposureDays: 410,
      shielding: 1.0,
    },
    {
      id: "cart-gen2",
      cartridge: "Cartucho Gen-2",
      plant: "Ashwagandha",
      viability: 98,
      status: "approved",
      label: "ADN VERIFICADO (AUTORIZADO)",
      detail: "Integridad genómica dentro de tolerancia · bóveda con blindaje de agua",
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
  vessel: "USCSS Odysseus // Hab-Module B",
  suitLink: "BIOSENSOR-LINK ACTIVE",
  bloodType: "O-",
  age: 38,
  evaHours: "142.5 HRS",
  lastSync: "14:22:08 UTC",
};

export const vitalSigns = {
  cortisol: {
    id: "cortisol",
    label: "Cortisol Sérico",
    value: "28.4 µg/dL",
    numericValue: 28.4,
    unit: "µg/dL",
    referenceRange: "6.0 – 18.4 µg/dL",
    status: "HIGH",
    alertTitle: "Cortisol Alto (Estrés Crónico)",
    alertDetail: "Elevación sostenida +54% sobre umbral nominal de vuelo.",
  },
  vitamins: {
    id: "vitamins",
    label: "Índice Vitamínico (C / D3 / B12)",
    value: "34%",
    numericValue: 34,
    unit: "%",
    referenceRange: "75% – 100%",
    status: "CRITICAL",
    alertTitle: "Déficit Vitamínico",
    alertDetail: "Depleción severa detectada. Riesgo inmunológico y óseo.",
  },
  heartRate: {
    id: "heartRate",
    label: "Frecuencia Cardíaca",
    value: "96 BPM",
    referenceRange: "60 – 85 BPM",
    status: "ELEVATED",
  },
  spo2: {
    id: "spo2",
    label: "Saturación O₂",
    value: "97.8%",
    referenceRange: "95.0 – 100%",
    status: "NOMINAL",
  },
  radiationDose: {
    id: "radiationDose",
    label: "Exposición Radiación GCR",
    value: "1.84 mSv/d",
    referenceRange: "< 1.50 mSv/d",
    status: "ELEVATED",
  },
  circadianDrift: {
    id: "circadianDrift",
    label: "Desfase Circadiano",
    value: "+3.2 HRS",
    referenceRange: "± 0.5 HRS",
    status: "ELEVATED",
  },
};

export default solutionData;
