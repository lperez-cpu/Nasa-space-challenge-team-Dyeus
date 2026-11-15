// Capa de datos: conecta la dashboard con Supabase usando su API REST (fetch, sin paquetes).
//
// Parte médica  → tabla `astronaut_log` (último registro): niveles LOW / MOD / HIGH por categoría,
//                 signos (heart_rate, sleep_quality, energy_level, mood, symptoms, days_in_space)
//                 y `prescription_plant` (plantas que decidió el backend).
// Parte plantas → tabla `plants`: condition, plant_name, active_compound, dose, grow_time_days,
//                 effect, latin_name, nasa_backed, evidence.
//
// El contrato hacia los componentes NO cambia: { data, biometrics, source, loading, refresh }.
// Si faltan las variables de entorno o Supabase falla → mockData (la demo nunca se rompe).
// La dashboard vuelve a consultar cada REFRESH_MS: si el backend agrega un registro, se ve solo.

import { useCallback, useEffect, useState } from "react";
import { missionData as mockMission, solutionData as mockSolution, vitalSigns as mockVitals } from "./mockData";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const REFRESH_MS = 15000;

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

async function rest(path, { method = "GET", body, prefer } = {}) {
  const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
  // Las claves "anon" antiguas son JWT y van también como Bearer;
  // las nuevas "sb_publishable_..." solo van en `apikey`.
  if (SUPABASE_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text(); // 201/204 con "return=minimal" llegan sin cuerpo
  return text ? JSON.parse(text) : null;
}

const norm = (s = "") => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ""));
const join = (...xs) => xs.filter(Boolean).join(" · ");

// Alertas de respaldo: solo si `astronaut_log` no existe o está vacía.
export const ACTIVE_ALERTS = [
  { field: "stress_level", label: "Stress", level: "HIGH", condition: "Estrés elevado", detail: "Cortisol 28.4 µg/dL", value: "28.4 µg/dL" },
  { field: "nutrition_level", label: "Nutrition", level: "HIGH", condition: "Déficit vitamina C", detail: "Vitamin index 34%", value: "34%" },
];

// ── Parte médica ──
// Cada categoría del registro apunta a la condición de `plants` que la trata.
const LOG_FIELDS = [
  { field: "stress_level", label: "Stress", condition: "Estrés elevado",
    detail: (l) => join(l.sleep_quality != null && `Sleep ${l.sleep_quality}/10`, l.mood != null && `Mood ${l.mood}/10`),
    value: (l) => (l.mood != null ? `Mood ${l.mood}/10` : "") },
  { field: "inflammation_level", label: "Inflammation", condition: "Inflamación",
    detail: (l) => (l.symptoms?.length ? `Symptoms: ${l.symptoms.join(", ")}` : ""), value: () => "" },
  { field: "cognitive_level", label: "Cognitive fatigue", condition: "Fatiga cognitiva",
    detail: (l) => (l.energy_level != null ? `Energy ${l.energy_level}/10` : ""),
    value: (l) => (l.energy_level != null ? `Energy ${l.energy_level}/10` : "") },
  { field: "cardiovascular_level", label: "Cardiovascular", condition: "Presión arterial alta",
    detail: (l) => (l.heart_rate != null ? `Heart rate ${l.heart_rate} bpm` : ""),
    value: (l) => (l.heart_rate != null ? `${l.heart_rate} BPM` : "") },
  { field: "nutrition_level", label: "Nutrition", condition: "Déficit vitamina C", detail: () => "", value: () => "" },
  // Se activa cuando astronaut_log tenga la columna bone_level (pérdida ósea → Pak choi, cultivado en Veggie).
  { field: "bone_level", label: "Bone loss", condition: "Pérdida ósea", detail: () => "", value: () => "" },
];

const HEALTHY = new Set(["", "low", "normal", "nominal", "ok", "bajo", "baja", "none", "ninguno", "sin alerta", "estable", "stable"]);
const MODERATE = new Set(["mod", "moderate", "moderado", "moderada", "medio", "media", "medium"]);
const HIGH = new Set(["high", "alto", "alta", "critical", "critico", "critica", "severe", "severo"]);

/** Valor de un `*_level` → null (sano) | { level, condition? }.
 *  Texto libre (p. ej. "Estrés elevado") también es alerta y se usa como condición. */
const parseLevel = (v) => {
  if (typeof v !== "string") return null;
  const n = norm(v);
  if (HEALTHY.has(n)) return null;
  if (MODERATE.has(n)) return { level: "MODERATE" };
  if (HIGH.has(n)) return { level: "HIGH" };
  return { level: "HIGH", condition: v.trim() };
};

const humanize = (field) => field.replace(/_level$/, "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export const alertsFromLog = (log) => {
  const known = LOG_FIELDS.map((f) => f.field);
  const extra = Object.keys(log)
    .filter((k) => k.endsWith("_level") && !known.includes(k))
    .sort()
    .map((field) => ({ field, label: humanize(field), condition: null, detail: () => "", value: () => "" }));
  return [...LOG_FIELDS, ...extra].flatMap((f) => {
    const parsed = parseLevel(log[f.field]);
    if (!parsed) return [];
    return [{
      field: f.field,
      label: f.label,
      level: parsed.level,
      condition: parsed.condition ?? f.condition ?? log[f.field],
      detail: f.detail(log),
      value: f.value(log),
    }];
  });
};

const alertTitle = (a) => `${a.label} · ${a.level}`;

// ── Datos de misión calculados (no fijos) ──
// Retraso de la señal = distancia / velocidad de la luz (máximo real Tierra–Marte ≈ 22 min por tramo).
const LIGHT_KM_S = 299792.458;
const earthDelayFrom = (distance) => {
  const m = /([\d.]+)\s*M\s*KM/i.exec(distance ?? "");
  if (!m) return undefined;
  const s = Math.round((Number(m[1]) * 1e6) / LIGHT_KM_S);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
const missionFor = (day) => ({
  ...mockMission,
  earthDelay: earthDelayFrom(mockMission.distanceFromEarth) ?? mockMission.earthDelay,
  missionDay: day != null ? `DAY ${day}` : String(mockMission.missionDay).replace(/^SOL\b/i, "DAY"),
});

// Dosis de radiación acumulada = días en el espacio × tasa de crucero (MSL/RAD), contra el
// límite de carrera de la NASA (600 mSv).
const radiationFor = (day) => {
  const rate = mockSolution.radiation?.rateMsvPerDay ?? 1.84;
  if (day == null || !mockVitals.radiationDose) return mockVitals.radiationDose;
  const total = day * rate;
  return {
    ...mockVitals.radiationDose,
    value: `${total.toFixed(1)} mSv`,
    referenceRange: "Career limit 600 mSv",
    status: total >= 600 ? "HIGH" : total >= 300 ? "ELEVATED" : "NOMINAL",
  };
};

// ── Fuente de cada dato: el equipo real de la NASA que lo produciría en la ISS ──
// (doc del equipo "Fuentes y Etiquetas NASA"). En la demo los datos llegan de astronaut_log
// (cargados a mano o por el Arduino que simula el wearable): por eso `sourceSimulated`.
export const DATA_SOURCES = {
  // Enlaces del doc del equipo; los que no están verificados quedan en null.
  bioMonitor: { name: "Bio-Monitor (Astroskin smart shirt)", url: "https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Facility.html?#id=7392" },
  actiwatch: { name: "Actiwatch Spectrum", url: null },
  everyWear: { name: "EveryWear app (crew self-report)", url: "https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=2042" },
  rad: { name: "MSL/RAD cruise dose rate (Zeitlin et al., Science 2013)", url: null },
  veggie: { name: "Veggie (Vegetable Production System)", url: "https://www.nasa.gov/missions/station/so-you-want-to-be-a-space-farmer/" },
  aph: { name: "Advanced Plant Habitat (APH)", url: "https://science.nasa.gov/mission/advanced-plant-habitat/" },
};
const src = (key, simulated = true) => ({ source: DATA_SOURCES[key].name, sourceUrl: DATA_SOURCES[key].url, sourceSimulated: simulated });

const VITAL_SOURCE = { heartRate: "bioMonitor", spo2: "bioMonitor", circadianDrift: "actiwatch", radiationDose: "rad" };
const ALERT_SOURCE = {
  stress_level: "actiwatch", inflammation_level: "everyWear", cognitive_level: "everyWear",
  cardiovascular_level: "bioMonitor", nutrition_level: "everyWear", bone_level: "everyWear",
};
const withVitalSources = (vitals) =>
  Object.fromEntries(Object.entries(vitals).map(([k, v]) => [
    k, VITAL_SOURCE[k] && v ? { ...v, ...src(VITAL_SOURCE[k], k !== "radiationDose") } : v,
  ]));

// Forma que usan BiometricsPanel / MedicalView (igual que vitalSigns.cortisol).
const buildBiometrics = (log, alerts) => {
  if (!log) return { mission: missionFor(null), alerts: null, vitals: withVitalSources(mockVitals) };
  const day = log.days_in_space;
  const hr = log.heart_rate;
  return {
    mission: missionFor(day),
    alerts: alerts.map((a) => ({
      id: `log-${a.field}`,
      alertTitle: alertTitle(a),
      alertDetail: join("Astronaut log", day != null && `Day ${day}`, a.detail),
      value: a.value || a.level,
      referenceRange: "Normal: LOW",
      status: a.level === "HIGH" ? "HIGH" : "ELEVATED",
      ...src(ALERT_SOURCE[a.field] ?? "everyWear"),
    })),
    vitals: withVitalSources({
      ...mockVitals,
      radiationDose: radiationFor(day),
      heartRate: hr == null ? mockVitals.heartRate : {
        ...mockVitals.heartRate,
        value: `${hr} BPM`,
        referenceRange: "60 – 100 BPM",
        status: hr > 100 ? "ELEVATED" : hr < 60 ? "LOW" : "NOMINAL",
      },
    }),
  };
};

// ── Parte plantas ──
// La base puede estar en español o en inglés (plants se tradujo; astronaut_log no siempre).
// Nombres equivalentes para cruzar `prescription_plant` con `plants.plant_name`.
const PLANT_ALIASES = [
  ["curcuma", "turmeric"], ["lavanda", "lavender"], ["romero", "rosemary"], ["ajo", "garlic"],
  ["menta", "peppermint", "mint"], ["albahaca", "basil"], ["lechuga", "lettuce"], ["chile hatch", "hatch chile", "chile"],
];
const aliasesOf = (name) => {
  const n = norm(name);
  return PLANT_ALIASES.find((group) => group.includes(n)) ?? [n];
};
const byName = (plants, name) => { // menor id primero
  const names = aliasesOf(name);
  return plants.find((p) => names.includes(norm(p.plant_name)));
};

// Palabras clave de cada categoría del registro, en los dos idiomas, para cruzar con
// `plants.condition` aunque sea una lista ("Stress, anxiety, fatigue").
const FIELD_KEYWORDS = {
  stress_level: ["stress", "estres", "anxiety", "ansiedad"],
  inflammation_level: ["inflammation", "inflamacion"],
  cognitive_level: ["cognitive", "cognitiva", "focus", "memory", "memoria"],
  cardiovascular_level: ["cardiovascular", "heart", "presion arterial", "blood pressure"],
  nutrition_level: ["vitamin", "vitamina", "nutri"],
  bone_level: ["bone", "osea", "oseo"],
};
// Síntomas del registro (español) → palabra en inglés para buscarla en las condiciones.
const SYMPTOM_EN = {
  insomnio: "insomnia", nauseas: "nausea", "dolor de cabeza": "headache", inflamacion: "inflammation",
  "fatiga cognitiva": "cognitive fatigue", "dolor muscular": "muscle soreness", ansiedad: "anxiety", fatiga: "fatigue",
};
const conditionTerms = (condition) => norm(condition).split(/\s*[,;/]\s*/).filter(Boolean);
/** Posición (0 = condición principal) en la que la planta trata la alerta, o -1. */
const matchIndex = (plant, alert) => {
  const terms = conditionTerms(plant.condition);
  const exact = terms.indexOf(norm(alert.condition));
  if (exact >= 0) return exact;
  const keys = FIELD_KEYWORDS[alert.field] ?? [];
  return terms.findIndex((t) => keys.some((k) => t.includes(k)));
};

// Gana la planta con respaldo NASA y, si empatan, la que tiene esa condición como principal.
const plantFor = (plants, alert) =>
  plants
    .map((p) => ({ p, i: matchIndex(p, alert) }))
    .filter(({ i }) => i >= 0)
    .sort((a, b) => Number(Boolean(b.p.nasa_backed)) - Number(Boolean(a.p.nasa_backed)) || a.i - b.i)[0]?.p;

// En qué invernadero de la NASA ya se cultivó la planta (solo las nasa_backed).
const APH_PLANTS = /chile|pepper|capsicum|r[aá]bano|radish|trigo|wheat|arabidopsis/i;
const habitatFor = (r) => {
  if (!r.nasa_backed) return { habitat: null, habitatLabel: "Candidate · not yet grown in Veggie or APH" };
  const key = APH_PLANTS.test(`${r.plant_name} ${r.latin_name ?? ""}`) ? "aph" : "veggie";
  return { habitat: key === "aph" ? "APH" : "Veggie", habitatLabel: `Grown in ${DATA_SOURCES[key].name}`, habitatUrl: DATA_SOURCES[key].url };
};

// Forma de consumo según la dosis de `plants` (o la columna consumption_method si existe).
// Secar o extraer no se puede hoy en la ISS: se marca como siguiente paso, sin ocultarlo.
const consumptionFrom = (dose = "") => {
  const d = norm(dose);
  if (/infus|tea|\bte\b/.test(d)) return "Infusion (Space Tea)";
  if (/fresc|fresh|hoja|leaf|leaves|diente|clove|porcion|serving/.test(d)) return "Direct consumption (fresh)";
  if (/visual|exposure|exposicion/.test(d)) return "Horticultural therapy (tending the plant)";
  if (/extract/.test(d)) return "Extract · not available on the ISS";
  if (/polvo|powder|seca|seco|dried|dry/.test(d)) return "Dried powder · needs a drying step (next step)";
  return undefined;
};

const mapPlant = (r, trigger, triggerValue) => clean({
  ...habitatFor(r),
  id: `plant-${r.id}`,
  plantId: r.id,
  plant: r.plant_name,
  latin: r.latin_name,
  condition: r.condition,
  trigger,
  triggerValue,
  effect: r.effect,
  compound: r.active_compound,
  dose: r.dose,
  consumptionMethod: r.consumption_method ?? consumptionFrom(r.dose),
  harvestDays: r.grow_time_days,
  nasaBacked: Boolean(r.nasa_backed),
  evidence: r.evidence,
});

/** Recetas: primero lo que decidió el backend (`prescription_plant`); si no hay, se cruzan
 *  las alertas con `plants.condition`. Cada receta dice qué alerta o síntoma la provocó. */
const buildPrescriptions = (log, alerts, plants) => {
  const named = (log?.prescription_plant ?? "").split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const rows = named.length
    ? named.map((n) => byName(plants, n))
    : alerts.map((a) => plantFor(plants, a));

  const seen = new Set();
  return rows.filter(Boolean).filter((r) => !seen.has(norm(r.plant_name)) && seen.add(norm(r.plant_name)))
    .map((r) => {
      const alert = alerts
        .map((a) => ({ a, i: matchIndex(r, a) }))
        .filter(({ i }) => i >= 0)
        .sort((x, y) => x.i - y.i)[0]?.a;
      if (alert) return mapPlant(r, alertTitle(alert), alert.detail || alert.value);
      const terms = conditionTerms(r.condition);
      const symptom = log?.symptoms?.find((s) => {
        const keys = [norm(s), SYMPTOM_EN[norm(s)]].filter(Boolean);
        return terms.some((t) => keys.some((k) => t.includes(k) || k.includes(t)));
      });
      return mapPlant(r, r.condition, symptom ? `Reported symptom: ${symptom}` : "Backend prescription");
    });
};

// `seed_cartridges` hoy es un inventario de bandejas: solo se usa si trae la forma de la auditoría.
const isAuditRow = (r) => typeof r.viability === "number" && (r.status === "approved" || r.status === "rejected");
const mapCartridge = (r) => ({
  id: r.id,
  cartridge: r.cartridge,
  plant: r.plant,
  viability: r.viability,
  status: r.status,
  label: r.label,
  detail: r.detail,
  exposureDays: r.exposure_days,
  shielding: r.shielding != null ? Number(r.shielding) : 1,
  rxTag: r.rx_tag ?? undefined,
});

// ── Seed Pods reales (`seed_cartridges`: pod_id, plant_id, slot, status, prescribed_for) ──
const podPrefix = (plant = "") => norm(plant).replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "POD";
const mapPod = (r, plants) => ({
  podId: r.pod_id,
  plantId: r.plant_id,
  plant: plants.find((p) => p.id === r.plant_id)?.plant_name,
  slot: r.slot,
  status: r.status, // ready | growing | planted | empty | harvested
  prescribedFor: r.prescribed_for ?? null,
});

/** Auditoría del cartucho de la receta activa. El pod autorizado es uno REAL de la bóveda
 *  (status "ready" primero); la viabilidad y la dosis de radiación siguen siendo de demo
 *  (viabilitySimulated) porque la tabla no guarda esa medición. */
const vaultFor = (plant, pods) => {
  if (!plant) return mockSolution.seedVault;
  const [gen3, gen2] = mockSolution.seedVault;
  const mine = pods.filter((p) => p.podId && norm(p.plant) === norm(plant) && p.status !== "harvested");
  const real = mine.find((p) => p.status === "ready") ?? mine.find((p) => p.status === "empty") ?? mine[0];
  const prefix = podPrefix(plant);
  const gen2Id = real?.podId ?? `${prefix}-Gen2-001`;
  return [
    { ...gen3, id: `${prefix}-Gen3-001`, cartridge: `Seed Pod ${prefix}-Gen3-001`, plant, podSimulated: true, viabilitySimulated: true },
    {
      ...gen2,
      id: gen2Id,
      cartridge: `Seed Pod ${gen2Id}`,
      plant,
      podStatus: real?.status,
      podSimulated: !real,
      viabilitySimulated: true,
      rxTag: `RX: ${plant.toUpperCase()} · ${gen2Id.toUpperCase()}`,
    },
  ];
};

const optional = (path) => rest(path).catch(() => []);

const MOCK_RESULT = {
  data: mockSolution,
  biometrics: { mission: missionFor(null), alerts: null, vitals: withVitalSources(mockVitals) },
  source: "mock",
};

/** Lee la parte médica y la de plantas. Devuelve { data, biometrics, source: "supabase" | "mock" }. */
export async function getSolutionData() {
  if (!supabaseEnabled) return MOCK_RESULT;
  try {
    const [plants, carts, logs, dispenses] = await Promise.all([
      rest("plants?select=*&order=id.asc"),
      optional("seed_cartridges?select=*"),
      optional("astronaut_log?select=*&order=created_at.desc,id.desc&limit=1"),
      optional("dispense_log?select=*&order=created_at.desc&limit=10"),
    ]);
    const log = logs[0] ?? null;

    // Con registro: alertas y recetas salen de él (puede no haber ninguna = astronauta estable).
    // Sin registro: alertas de respaldo, para que la demo siempre muestre algo.
    const alerts = log ? alertsFromLog(log) : ACTIVE_ALERTS;
    const prescriptions = buildPrescriptions(log, alerts, plants);
    if (!log && !prescriptions.length) throw new Error("Ninguna planta coincide con las alertas de respaldo");

    // Sin auditoría real en la base, los cartuchos de demo siguen a la primera receta activa
    // para que la dashboard no dispense una planta que nadie recetó.
    const auditRows = carts.filter(isAuditRow);
    const seedPods = carts.filter((r) => r.pod_id).map((r) => mapPod(r, plants));
    const seedVault = auditRows.length ? auditRows.map(mapCartridge) : vaultFor(prescriptions[0]?.plant, seedPods);
    return {
      source: "supabase",
      biometrics: buildBiometrics(log, alerts),
      data: {
        ...mockSolution,
        crew: log?.days_in_space != null ? { ...mockSolution.crew, missionDay: log.days_in_space } : mockSolution.crew,
        prescriptions,
        seedVault,
        seedPods, // inventario real de la bóveda (todos los pods)
        // Historial de dispensados (para Plant Status). dispense_log no guarda el cartucho:
        // se asocia al cartucho autorizado de esa planta.
        // Filas sin planta (plant_id null) se omiten: no se puede saber qué se cultivó.
        dispenseHistory: dispenses.filter((d) => plants.some((p) => p.id === d.plant_id)).map((d) => {
          const plant = plants.find((p) => p.id === d.plant_id)?.plant_name;
          const pod = seedPods.find((p) => p.plantId === d.plant_id && p.status !== "harvested");
          const cart = seedVault.find((c) => c.status === "approved" && norm(c.plant) === norm(plant));
          return {
            id: d.id,
            plant_id: d.plant_id,
            plant,
            cartridge_id: cart?.id ?? pod?.podId,
            dose_given: d.dose_given,
            notes: d.notes,
            astronaut_log_id: d.astronaut_log_id,
            dispensed_at: d.created_at,
          };
        }),
        astronautLog: log,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.warn("[E.D.E.N.] Supabase no disponible, usando datos de demo:", err);
    return MOCK_RESULT;
  }
}

/** Registra en `dispense_log` que se dispensó un cartucho (no bloquea la UI si falla).
 *  Columnas: plant_id (obligatorio), dose_given, notes, astronaut_log_id. */
export async function logDispense(cartridge) {
  if (!supabaseEnabled || !cartridge?.plant) return;
  try {
    const [plants, logs] = await Promise.all([
      rest(`plants?select=id,dose&plant_name=eq.${encodeURIComponent(cartridge.plant)}&order=id.asc`),
      optional("astronaut_log?select=id&order=created_at.desc,id.desc&limit=1"),
    ]);
    const plant = plants[0];
    if (!plant) throw new Error(`La planta "${cartridge.plant}" no está en plants`);
    await rest("dispense_log", {
      method: "POST",
      body: clean({
        plant_id: plant.id,
        dose_given: plant.dose,
        notes: [cartridge.cartridge, cartridge.rxTag, cartridge.viability != null ? `viability ${cartridge.viability}%` : null]
          .filter(Boolean).join(" · "),
        astronaut_log_id: logs[0]?.id,
      }),
      prefer: "return=minimal",
    });
    await markPodGrowing(cartridge.podId ?? cartridge.id);
  } catch (err) {
    console.warn("[E.D.E.N.] No se pudo registrar el dispensado:", err);
  }
}

/** Marca el Seed Pod como "growing" en `seed_cartridges` para que siga bloqueado tras recargar.
 *  Necesita una política RLS de UPDATE para anon (ver supabase/pod_status_update.sql);
 *  sin ella PostgREST no actualiza ninguna fila y solo se avisa en consola. */
async function markPodGrowing(podId) {
  if (!podId || !/^[A-Z]{2,4}-Gen\d+-\d+$/i.test(String(podId))) return; // solo pods reales (no los de demo)
  try {
    const rows = await rest(`seed_cartridges?pod_id=eq.${encodeURIComponent(podId)}&status=eq.ready`, {
      method: "PATCH",
      body: { status: "growing", planted_at: new Date().toISOString() },
      prefer: "return=representation",
    });
    if (!rows?.length) console.warn(`[E.D.E.N.] El pod ${podId} no se actualizó (¿falta la política de UPDATE o no estaba "ready"?)`);
  } catch (err) {
    console.warn(`[E.D.E.N.] No se pudo marcar el pod ${podId} como growing:`, err);
  }
}

/** Hook para App.jsx: arranca con los datos de demo, los reemplaza al llegar Supabase y
 *  vuelve a consultar cada 15 s. Devuelve { data, biometrics, source, loading, refresh }. */
export function useSolutionData() {
  const [state, setState] = useState({ ...MOCK_RESULT, loading: supabaseEnabled });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    getSolutionData().then((r) => alive && setState({ ...r, loading: false }));
    return () => { alive = false; };
  }, [tick]);

  useEffect(() => {
    if (!supabaseEnabled) return undefined;
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { ...state, refresh };
}
