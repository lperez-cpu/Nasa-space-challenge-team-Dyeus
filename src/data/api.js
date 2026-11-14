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

// ── Mapeo: columnas de la base de datos (snake_case) → forma que usa SolutionPanel ──
const mapPrescription = (r) => ({
  id: r.id,
  plant: r.plant,
  latin: r.latin_name,
  trigger: r.condition,
  triggerValue: r.trigger_value,
  effect: r.effect,
  compound: r.active_compound,
  dose: r.dose,
  harvestDays: r.harvest_days,
  nasaBacked: r.nasa_backed,
  evidence: r.evidence,
});

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

/** Lee todo lo que necesita SolutionPanel. Devuelve { data, source: "supabase" | "mock" }. */
export async function getSolutionData() {
  if (!supabaseEnabled) return { data: mockSolution, source: "mock" };
  try {
    const [rx, carts, cfg] = await Promise.all([
      rest("prescriptions?select=*&active=eq.true&order=sort.asc"),
      rest("seed_cartridges?select=*&order=sort.asc"),
      rest("mission_config?select=*&id=eq.1"),
    ]);
    if (!rx.length || !carts.length) throw new Error("Tablas vacías");
    const c = cfg[0];
    return {
      source: "supabase",
      data: {
        crew: c
          ? { id: c.crew_id, name: c.crew_name, module: c.crew_module }
          : mockSolution.crew,
        radiation: c
          ? { rateMsvPerDay: Number(c.rate_msv_per_day), source: c.radiation_source }
          : mockSolution.radiation,
        prescriptions: rx.map(mapPrescription),
        seedVault: carts.map(mapCartridge),
      },
    };
  } catch (err) {
    console.warn("[Bio-Sync] Supabase no disponible, usando datos de demo:", err);
    return { data: mockSolution, source: "mock" };
  }
}

/** Registra en Supabase que se dispensó un cartucho (no bloquea la UI si falla). */
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
