// Project E.D.E.N. — prueba de seguridad de Supabase (RLS) contra la base real. Sin dependencias (Node 22+).
//
//   node tests/rls.mjs
//
// Intenta, con la clave pública anon y con la cuenta de Astronauta, lo que NO debería poder hacerse
// (extraer pods sin sesión, escribir historial, inyectar lecturas a nombre de un astronauta, darse rol
// admin, aprobar su propia solicitud...). Esas escrituras se mandan de verdad y deben ser rechazadas,
// así que no dejan datos. Las comprobaciones de lectura no escriben nada.
// Lee VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY de .env y la cuenta de CUENTAS_DEMO.local.txt
// (o CREDENTIALS_FILE). Nunca imprime credenciales.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = Object.fromEntries(
  (existsSync(".env") ? readFileSync(".env", "utf8") : "").split(/\r?\n/)
    .map((l) => /^\s*([A-Z_]+)\s*=\s*"?([^"\r\n]*)"?/.exec(l)).filter(Boolean).map((m) => [m[1], m[2]]));
const URL = (process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL)?.replace(/\/$/, "");
const KEY = process.env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY;
if (!URL || !KEY) { console.error("Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"); process.exit(2); }

const credsFile = resolve(process.env.CREDENTIALS_FILE ?? "CUENTAS_DEMO.local.txt");
const line = existsSync(credsFile) && readFileSync(credsFile, "utf8").split(/\r?\n/).find((l) => /^\s*Astronauta\s+\S+@\S+\s+\S+/.test(l));
const [, EMAIL, PASSWORD] = (line && /^\s*Astronauta\s+(\S+@\S+)\s+(\S+)/.exec(line)) || [];

const req = async (path, { method = "GET", body, token, prefer } = {}) => {
  const headers = { apikey: KEY, "Content-Type": "application/json", Prefer: prefer ?? "return=representation" };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${KEY}`;
  const r = await fetch(`${URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: r.status, data };
};
const rows = (r) => (Array.isArray(r.data) ? r.data.length : 0);
const denied = (r) => rlsError(r) || (r.status < 300 && rows(r) === 0); // RLS: rechazo o 0 filas afectadas
// Rechazo por permisos/RLS (no cualquier error: un 400 por datos mal formados no prueba nada).
const rlsError = (r) => [401, 403].includes(r.status) || r.data?.code === "42501";

const results = [];
const check = (name, ok, detail = "") => results.push({ ok, name, detail });
const FAKE_UUID = "00000000-0000-4000-8000-000000000000";

// ── Sin sesión (clave anon) ──
let r = await req("/rest/v1/plants?select=id&limit=1");
check("anon puede leer el catálogo de plantas", r.status === 200 && rows(r) === 1, `HTTP ${r.status}${r.data?.code ? " " + r.data.code : ""}`);
for (const t of ["astronaut_log", "seed_cartridges", "dispense_log", "user_profiles", "access_requests", "profile_views"]) {
  r = await req(`/rest/v1/${t}?select=*&limit=1`);
  check(`anon NO lee ${t}`, rows(r) === 0, `HTTP ${r.status}, ${rows(r)} filas`);
}
r = await req("/rest/v1/seed_cartridges?status=eq.ready", { method: "PATCH", body: { status: "growing" } });
check("anon NO extrae pods", denied(r), `HTTP ${r.status}, ${rows(r)} filas`);
r = await req("/rest/v1/dispense_log", { method: "POST", body: { plant_id: 1, notes: "rls-test" } });
check("anon NO escribe dispense_log", rlsError(r), `HTTP ${r.status}${r.data?.code ? " " + r.data.code : ""}`);
r = await req("/rest/v1/astronaut_log", { method: "POST", body: { user_id: FAKE_UUID, symptoms: ["rls-test"] }, prefer: "return=minimal" });
check("anon NO inyecta lecturas a nombre de un astronauta", rlsError(r), `HTTP ${r.status}${r.data?.code ? " " + r.data.code : ""}`);
r = await req("/rest/v1/access_requests", { method: "POST", body: { email: "rls-test@example.com", requested_role: "admin", status: "approved" }, prefer: "return=minimal" });
check("anon NO crea solicitudes ya aprobadas", rlsError(r), `HTTP ${r.status}${r.data?.code ? " " + r.data.code : ""}`);
r = await req("/rest/v1/user_profiles", { method: "POST", body: { id: FAKE_UUID, role: "admin" }, prefer: "return=minimal" });
check("anon NO crea perfiles", rlsError(r), `HTTP ${r.status}${r.data?.code ? " " + r.data.code : ""}`);

// ── Con la cuenta de Astronauta (paciente) ──
if (!EMAIL) check("cuenta de Astronauta disponible", false, `no se encontró ${credsFile}`);
else {
  const login = await req("/auth/v1/token?grant_type=password", { method: "POST", body: { email: EMAIL, password: PASSWORD } });
  const token = login.data?.access_token;
  const me = login.data?.user?.id;
  check("Astronauta inicia sesión", Boolean(token), `HTTP ${login.status}`);
  if (token) {
    r = await req("/rest/v1/seed_cartridges?select=pod_id", { token });
    check("Astronauta ve la bóveda de Seed Pods", rows(r) > 0, `${rows(r)} pods`);
    r = await req("/rest/v1/user_profiles?select=id,role", { token });
    check("Astronauta solo ve su propio perfil", rows(r) === 1 && r.data[0].id === me, `${rows(r)} perfiles`);
    r = await req(`/rest/v1/user_profiles?id=eq.${me}`, { method: "PATCH", body: { role: "admin" }, token });
    check("Astronauta NO puede darse rol admin", denied(r), `HTTP ${r.status}, ${rows(r)} filas`);
    r = await req("/rest/v1/astronaut_log?select=user_id", { token });
    check("Astronauta solo ve sus registros de salud", rows(r) > 0 && r.data.every((x) => x.user_id === me), `${rows(r)} registros`);
    r = await req("/rest/v1/access_requests?select=id", { token });
    check("Astronauta NO ve solicitudes de acceso", rows(r) === 0, `${rows(r)} filas`);
    r = await req("/rest/v1/access_requests?status=eq.pending", { method: "PATCH", body: { status: "approved" }, token });
    check("Astronauta NO aprueba solicitudes", denied(r), `HTTP ${r.status}, ${rows(r)} filas`);
    r = await req("/rest/v1/seed_cartridges?status=eq.growing", { method: "PATCH", body: { status: "ready" }, token });
    check("Astronauta NO reinicia pods ya extraídos", denied(r), `HTTP ${r.status}, ${rows(r)} filas`);
  }
}

for (const x of results) console.log(`${x.ok ? "PASS" : "FAIL"}  ${x.name}${x.detail ? `  (${x.detail})` : ""}`);
const failed = results.filter((x) => !x.ok).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones OK`);
process.exit(failed ? 1 : 0);
