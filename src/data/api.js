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

// Forma que usan BiometricsPanel / MedicalView (igual que vitalSigns.cortisol).
const buildBiometrics = (log, alerts) => {
  if (!log) return { mission: mockMission, alerts: null, vitals: mockVitals };
  const day = log.days_in_space;
  const hr = log.heart_rate;
  return {
    mission: { ...mockMission, missionDay: day != null ? `DAY ${day}` : mockMission.missionDay },
    alerts: alerts.map((a) => ({
      id: `log-${a.field}`,
      alertTitle: alertTitle(a),
      alertDetail: join("Astronaut log", day != null && `Day ${day}`, a.detail),
      value: a.value || a.level,
      referenceRange: "LOW",
      status: a.level === "HIGH" ? "HIGH" : "ELEVATED",
    })),
    vitals: hr == null ? mockVitals : {
      ...mockVitals,
      heartRate: {
        ...mockVitals.heartRate,
        value: `${hr} BPM`,
        referenceRange: "60 – 100 BPM",
        status: hr > 100 ? "ELEVATED" : hr < 60 ? "LOW" : "NOMINAL",
      },
    },
  };
};

// ── Parte plantas ──
const byName = (plants, name) => plants.find((p) => norm(p.plant_name) === norm(name)); // menor id primero

// Si varias plantas tratan la misma condición, gana la que tiene respaldo NASA.
const plantFor = (plants, condition) =>
  plants
    .filter((p) => norm(p.condition) === norm(condition))
    .sort((a, b) => Number(Boolean(b.nasa_backed)) - Number(Boolean(a.nasa_backed)))[0];

const mapPlant = (r, trigger, triggerValue) => clean({
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
    : alerts.map((a) => plantFor(plants, a.condition));

  const seen = new Set();
  return rows.filter(Boolean).filter((r) => !seen.has(norm(r.plant_name)) && seen.add(norm(r.plant_name)))
    .map((r) => {
      const alert = alerts.find((a) => norm(a.condition) === norm(r.condition));
      if (alert) return mapPlant(r, alertTitle(alert), alert.detail || alert.value);
      const symptom = log?.symptoms?.find((s) => norm(r.condition).includes(norm(s)) || norm(s).includes(norm(r.condition)));
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

const demoVaultFor = (plant) =>
  !plant ? mockSolution.seedVault : mockSolution.seedVault.map((c) => ({
    ...c,
    plant,
    rxTag: c.rxTag ? `RX: ${plant.toUpperCase()} GEN-2` : c.rxTag,
  }));

const optional = (path) => rest(path).catch(() => []);

const MOCK_RESULT = {
  data: mockSolution,
  biometrics: { mission: mockMission, alerts: null, vitals: mockVitals },
  source: "mock",
};

/** Lee la parte médica y la de plantas. Devuelve { data, biometrics, source: "supabase" | "mock" }. */
export async function getSolutionData() {
  if (!supabaseEnabled) return MOCK_RESULT;
  try {
    const [plants, carts, logs] = await Promise.all([
      rest("plants?select=*&order=id.asc"),
      optional("seed_cartridges?select=*"),
      optional("astronaut_log?select=*&order=created_at.desc,id.desc&limit=1"),
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
    const seedVault = auditRows.length ? auditRows.map(mapCartridge) : demoVaultFor(prescriptions[0]?.plant);
    return {
      source: "supabase",
      biometrics: buildBiometrics(log, alerts),
      data: {
        ...mockSolution,
        crew: log?.days_in_space != null ? { ...mockSolution.crew, missionDay: log.days_in_space } : mockSolution.crew,
        prescriptions,
        seedVault,
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
  } catch (err) {
    console.warn("[E.D.E.N.] No se pudo registrar el dispensado:", err);
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
