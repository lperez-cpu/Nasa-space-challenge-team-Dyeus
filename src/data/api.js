// Capa de datos: conecta el frontend con Supabase usando su API REST.
// No necesita instalar ningún paquete (usa fetch).
//
// - Si faltan las variables de entorno o Supabase falla → usa mockData (la demo nunca se rompe).
// - Si la compañera de backend usa otros nombres de columnas, solo se ajustan las funciones map*().

import { useEffect, useState } from "react";
import { solutionData as mockSolution } from "./mockData";

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
  return res.status === 204 ? null : res.json();
}

// Alertas activas del astronauta → condición de la tabla `plants` que las trata.
// (Cuando BiometricsPanel lea signos vitales reales, esta lista saldrá de ahí.)
export const ACTIVE_ALERTS = [
  { condition: "Estrés elevado", trigger: "Cortisol Alto", triggerValue: "28.4 µg/dL" },
  { condition: "Déficit vitamina C", trigger: "Déficit Vitamínico", triggerValue: "Índice vitamínico 34%" },
];

const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ""));

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

/** Lee todo lo que necesita SolutionPanel. Devuelve { data, source: "supabase" | "mock" }. */
export async function getSolutionData() {
  if (!supabaseEnabled) return { data: mockSolution, source: "mock" };
  try {
    const [plants, carts] = await Promise.all([
      rest("plants?select=*&order=id.asc"),
      optional("seed_cartridges?select=*&order=sort.asc"),
    ]);

    const prescriptions = ACTIVE_ALERTS.map((alert) => {
      const row = plants.find((p) => norm(p.condition) === norm(alert.condition));
      return row && mapPlant(row, alert);
    }).filter(Boolean);
    if (!prescriptions.length) throw new Error("Ninguna planta coincide con las alertas activas");

    return {
      source: "supabase",
      data: {
        ...mockSolution,
        prescriptions,
        seedVault: carts.length ? carts.map(mapCartridge) : mockSolution.seedVault,
      },
    };
  } catch (err) {
    console.warn("[Bio-Sync] Supabase no disponible, usando datos de demo:", err);
    return { data: mockSolution, source: "mock" };
  }
}

/** Registra en Supabase que se dispensó un cartucho (no bloquea la UI si falla).
 *  Requiere la tabla `dispense_log` (ver supabase/schema.sql); sin ella solo avisa en consola. */
export async function logDispense(cartridge) {
  if (!supabaseEnabled || !cartridge) return;
  try {
    await rest("dispense_log", {
      method: "POST",
      body: { cartridge_id: cartridge.id },
      prefer: "return=minimal",
    });
  } catch (err) {
    console.warn("[Bio-Sync] No se pudo registrar el dispensado:", err);
  }
}

/** Hook para App.jsx: arranca con los datos de demo y los reemplaza al llegar Supabase. */
export function useSolutionData() {
  const [state, setState] = useState({ data: mockSolution, source: "mock", loading: supabaseEnabled });
  useEffect(() => {
    let alive = true;
    getSolutionData().then((r) => alive && setState({ ...r, loading: false }));
    return () => { alive = false; };
  }, []);
  return state;
}
