// Capa de datos: conecta el frontend con Supabase usando su API REST.
// No necesita instalar ningún paquete (usa fetch).
//
// - Si faltan las variables de entorno o Supabase falla → usa mockData (la demo nunca se rompe).
// - Si la compañera de backend usa otros nombres de columnas, solo se ajustan las funciones map*().

import { useCallback, useEffect, useState } from "react";
import { missionData as mockMission, solutionData as mockSolution } from "./mockData";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// Alertas de respaldo: se usan solo si `astronaut_log` no existe o está vacía.
export const ACTIVE_ALERTS = [
  { condition: "Estrés elevado", trigger: "Cortisol Alto", triggerValue: "28.4 µg/dL" },
  { condition: "Déficit vitamina C", trigger: "Déficit Vitamínico", triggerValue: "Índice vitamínico 34%" },
];

const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ""));
const parts = (...xs) => xs.filter(([, v]) => v != null && v !== "").map(([k, v]) => `${k} ${v}`).join(" · ");

// ── Alertas desde `astronaut_log` ──
// CUALQUIER columna que termine en `_level` y no diga "Normal" es una alerta; su valor
// se busca tal cual en `plants.condition` (p. ej. "Estrés elevado" → Ashwagandha).
// Para sumar un problema nuevo: columna `algo_level` en astronaut_log + fila en plants.
// Estas columnas conocidas solo agregan un detalle (sueño, energía…) junto a la alerta.
// `short` = valor corto para el número grande de la alerta en BiometricsPanel.
const LOG_FIELDS = [
  { field: "stress_level", detail: (l) => parts(["Sueño", l.sleep_quality], ["Ánimo", l.mood]), short: (l) => parts(["Ánimo", l.mood]) },
  { field: "cognitive_level", detail: (l) => parts(["Energía", l.energy_level]), short: (l) => parts(["Energía", l.energy_level]) },
  { field: "cardiovascular_level", detail: (l) => parts(["FC", l.heart_rate != null ? `${l.heart_rate} lpm` : null]), short: (l) => (l.heart_rate != null ? `${l.heart_rate} BPM` : "") },
  { field: "inflammation_level", detail: (l) => (l.symptoms ?? []).join(", "), short: () => "" },
  { field: "nutrition_level", detail: () => "Registro nutricional", short: () => "" },
];

// Valores que significan "sin problema" (se compara el texto completo, no partes).
const HEALTHY = new Set(["normal", "nominal", "ok", "low", "bajo", "baja", "none", "ninguno", "sin alerta", "estable"]);
const isAlert = (v) => typeof v === "string" && v.trim() !== "" && !HEALTHY.has(norm(v));

export const alertsFromLog = (log) => {
  const known = LOG_FIELDS.map((f) => f.field);
  const extra = Object.keys(log)
    .filter((k) => k.endsWith("_level") && !known.includes(k))
    .sort()
    .map((field) => ({ field, detail: () => "", short: () => "" }));
  return [...LOG_FIELDS, ...extra]
    .filter(({ field }) => isAlert(log[field]))
    .map(({ field, detail, short }) => ({
      field,
      shortValue: short(log),
      condition: log[field],
      trigger: log[field],
      triggerValue: detail(log) || (log.days_in_space != null ? `Día ${log.days_in_space}` : ""),
    }));
};

// ── Datos para BiometricsPanel (contrato pedido en HANDOFF_CLAUDE.txt) ──
// biometrics = { mission, alerts }: `alerts` tiene la forma de vitalSigns.cortisol
// (alertTitle, alertDetail, value, referenceRange, status). null = usar mockData.
const buildBiometrics = (log, alerts) => {
  if (!log) return { mission: mockMission, alerts: null };
  return {
    mission: {
      ...mockMission,
      missionDay: log.days_in_space != null ? `DÍA ${log.days_in_space}` : mockMission.missionDay,
    },
    alerts: alerts.map((a, i) => ({
      id: `log-${a.field}`,
      alertTitle: a.condition,
      alertDetail: a.triggerValue ? `Registro del astronauta · ${a.triggerValue}` : "Registro del astronauta (astronaut_log)",
      value: a.shortValue || undefined,
      referenceRange: "Normal",
      status: i === 0 ? "HIGH" : "ELEVATED",
    })),
  };
};

// Si varias plantas tratan la misma condición, gana la que tiene respaldo NASA
// (luego la de menor id, por el orden de la consulta).
const plantFor = (plants, condition) =>
  plants
    .filter((p) => norm(p.condition) === norm(condition))
    .sort((a, b) => Number(Boolean(b.nasa_backed)) - Number(Boolean(a.nasa_backed)))[0];

// ── Mapeo: tabla `plants` de Supabase → forma que usa SolutionPanel ──
// Columnas: id, condition, plant_name, active_compound, dose, grow_time_days, effect
// (latin_name / nasa_backed / evidence son opcionales: si se agregan, se muestran).
const mapPlant = (r, alert) => {
  // Completa con los datos de demo si la planta ya existía allí (nombre latino, evidencia…)
  const extra = mockSolution.prescriptions.find((p) => norm(p.plant) === norm(r.plant_name)) ?? {};
  return {
    ...extra,
    ...clean({
      id: `plant-${r.id}`,
      plant: r.plant_name,
      latin: r.latin_name,
      trigger: alert.trigger,
      triggerValue: alert.triggerValue,
      effect: r.effect,
      compound: r.active_compound,
      dose: r.dose,
      harvestDays: r.grow_time_days,
      nasaBacked: r.nasa_backed,
      evidence: r.evidence,
    }),
  };
};

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

// Tablas opcionales (aún no existen en Supabase): si fallan, se usan los datos de demo.
const optional = (path) => rest(path).catch(() => []);

const MOCK_RESULT = { data: mockSolution, biometrics: { mission: mockMission, alerts: null }, source: "mock" };

/** Lee lo que necesitan ambos paneles. Devuelve { data, biometrics, source: "supabase" | "mock" }. */
export async function getSolutionData() {
  if (!supabaseEnabled) return MOCK_RESULT;
  try {
    const [plants, carts, logs] = await Promise.all([
      rest("plants?select=*&order=id.asc"),
      optional("seed_cartridges?select=*&order=sort.asc"),
      optional("astronaut_log?select=*&order=created_at.desc&limit=1"),
    ]);
    const log = logs[0] ?? null;

    // Con registro: las alertas salen de él (puede no haber ninguna = astronauta estable).
    // Sin registro: alertas de respaldo, para que la demo siempre muestre algo.
    const alerts = log ? alertsFromLog(log) : ACTIVE_ALERTS;
    const prescriptions = alerts.map((alert) => {
      const row = plantFor(plants, alert.condition);
      return row && mapPlant(row, alert);
    }).filter(Boolean);
    if (!log && !prescriptions.length) throw new Error("Ninguna planta coincide con las alertas activas");

    return {
      source: "supabase",
      biometrics: buildBiometrics(log, alerts),
      data: {
        ...mockSolution,
        crew: log?.days_in_space != null ? { ...mockSolution.crew, missionDay: log.days_in_space } : mockSolution.crew,
        prescriptions,
        seedVault: carts.length ? carts.map(mapCartridge) : mockSolution.seedVault,
        astronautLog: log,
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
      optional("astronaut_log?select=id&order=created_at.desc&limit=1"),
    ]);
    const plant = plants[0];
    if (!plant) throw new Error(`La planta "${cartridge.plant}" no está en plants`);
    await rest("dispense_log", {
      method: "POST",
      body: clean({
        plant_id: plant.id,
        dose_given: plant.dose,
        notes: [cartridge.cartridge, cartridge.rxTag, cartridge.viability != null ? `viabilidad ${cartridge.viability}%` : null]
          .filter(Boolean).join(" · "),
        astronaut_log_id: logs[0]?.id,
      }),
      prefer: "return=minimal",
    });
  } catch (err) {
    console.warn("[E.D.E.N.] No se pudo registrar el dispensado:", err);
  }
}

/** Hook para App.jsx: arranca con los datos de demo y los reemplaza al llegar Supabase.
 *  Devuelve { data, biometrics, source, loading, refresh } — refresh() vuelve a consultar. */
export function useSolutionData() {
  const [state, setState] = useState({ ...MOCK_RESULT, loading: supabaseEnabled });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    let alive = true;
    getSolutionData().then((r) => alive && setState({ ...r, loading: false }));
    return () => { alive = false; };
  }, [tick]);
  return { ...state, refresh };
}
