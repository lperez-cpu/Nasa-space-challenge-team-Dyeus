// Project E.D.E.N. — prueba de punta a punta con Edge/Chrome headless (Chrome DevTools Protocol).
// Sin dependencias: Node 22+ (fetch y WebSocket globales).
//
//   node tests/e2e.mjs [url] [carpeta-salida]
//   node tests/e2e.mjs https://nasa-space-challenge-team-dyeus.vercel.app out/e2e
//
// - Recorre las 5 ventanas en escritorio (1440x900) y celular (390x844) y saca capturas.
// - Prueba el flujo Dispensar. Las escrituras (POST/PATCH/DELETE) a dispense_log y seed_cartridges se
//   INTERCEPTAN (respuesta 201 falsa): la base real no se toca y no se gastan pods. Con REAL_WRITES=1 se deja pasar la escritura.
// - Registra errores de consola, excepciones y respuestas HTTP >= 400.
// - Escribe report.json con el texto visible de cada pantalla y un resumen de fallas.
// - LOGIN: la app exige sesión. La prueba entra con la cuenta de Astronauta leída del archivo
//   LOCAL CUENTAS_DEMO.local.txt (ignorado por git; nunca credenciales en el repo). Otra ruta:
//   variable CREDENTIALS_FILE. Sin archivo, la prueba se detiene en la pantalla de login.
// Variable BROWSER para otro navegador (por defecto Edge en Windows).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const URL = process.argv[2] ?? "http://localhost:5173/";
const OUT = resolve(process.argv[3] ?? "out/e2e");
const BROWSER = process.env.BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const REAL_WRITES = process.env.REAL_WRITES === "1";
const PORT = 9300 + Math.floor(Math.random() * 500);
mkdirSync(OUT, { recursive: true });

// Cuenta de Astronauta desde el archivo local: línea "Astronauta  <correo>  <contraseña> …"
function astronautCredentials() {
  const file = resolve(process.env.CREDENTIALS_FILE ?? "CUENTAS_DEMO.local.txt");
  if (!existsSync(file)) return null;
  const line = readFileSync(file, "utf8").split(/\r?\n/).find((l) => /^\s*Astronauta\s+\S+@\S+\s+\S+/.test(l));
  const m = line && /^\s*Astronauta\s+(\S+@\S+)\s+(\S+)/.exec(line);
  return m ? { email: m[1], password: m[2] } : null;
}
const CREDS = astronautCredentials();

const VIEWS = [
  ["astronaut", "Astronaut Data"],
  ["medical", "Medical Consultation"],
  ["dispenser", "Dispenser"],
  ["inventory", "Seed Pod Vault"],
  ["plants", "Plant Status"],
];
const VIEWPORTS = { desktop: [1440, 900, false], mobile: [390, 844, true] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = spawn(BROWSER, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${OUT}/profile`, "about:blank"], { stdio: "ignore" });

let page;
for (let i = 0; i < 60 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); } catch {}
  if (!page) await sleep(250);
}
if (!page) { console.error("No se pudo abrir el navegador"); process.exit(2); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pending = new Map();
const issues = { console: [], exceptions: [], http: [], intercepted: [] };
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });

ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  const p = msg.params;
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(p.type))
    issues.console.push(`[${p.type}] ` + p.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
  // Violaciones de CSP y otros errores del navegador que no pasan por console.* (los de red ya cuentan en http).
  if (msg.method === "Log.entryAdded" && p.entry.level === "error" && p.entry.source !== "network")
    issues.console.push(`[${p.entry.source}] ` + p.entry.text.slice(0, 300));
  if (msg.method === "Runtime.exceptionThrown") issues.exceptions.push(p.exceptionDetails.exception?.description?.slice(0, 300));
  if (msg.method === "Network.responseReceived" && p.response.status >= 400)
    issues.http.push(`${p.response.status} ${p.response.url.slice(0, 160)}`);
  if (msg.method === "Fetch.requestPaused") {
    const rq = p.request;
    if (!["POST", "PATCH", "DELETE"].includes(rq.method) || REAL_WRITES) { send("Fetch.continueRequest", { requestId: p.requestId }); return; }
    issues.intercepted.push(`${rq.method} ${rq.url.replace(/^https:\/\/[^/]+/, "")} ${rq.postData ?? ""}`);
    send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 201,
      responseHeaders: [{ name: "Access-Control-Allow-Origin", value: "*" }], body: "" });
  }
};

const evalJs = async (expression) =>
  (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => {
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, "base64"));
};
// Clic por texto exacto del inicio del botón (evita que "Dispenser" capture "DISPENSE ...").
const click = (label, exact = false) => evalJs(`(() => {
  const want = ${JSON.stringify(label.toUpperCase())};
  const els = [...document.querySelectorAll('button,a,[role=button]')].filter(e => e.offsetParent !== null);
  const el = els.find(e => { const t = (e.innerText || e.getAttribute('aria-label') || '').trim().toUpperCase();
    return ${exact} ? t === want : t.startsWith(want); });
  if (!el) return 'NOT FOUND'; el.click(); return 'ok'; })()`);
const visibleText = () => evalJs("(document.querySelector('main') || document.body).innerText");
const overflowX = () => evalJs("document.documentElement.scrollWidth > window.innerWidth + 1");

await send("Runtime.enable");
await send("Page.enable");
await send("Network.enable");
await send("Log.enable");
await send("Fetch.enable", { patterns: [
  { urlPattern: "*dispense_log*", requestStage: "Request" },
  { urlPattern: "*seed_cartridges*", requestStage: "Request" }, // PATCH del pod a "growing"
  { urlPattern: "*profile_views*", requestStage: "Request" },
  { urlPattern: "*access_requests*", requestStage: "Request" },
  { urlPattern: "*rpc/reload_pod*", requestStage: "Request" }, // recarga de pods reutilizables
] });

// Llena el formulario de LoginGateView (React controlado) y envía. Devuelve el estado del login.
const login = async () => {
  const hasForm = await evalJs("!!document.querySelector('input[type=password]')");
  if (!hasForm) return "already-signed-in";
  if (!CREDS) return "NO-CREDENTIALS-FILE";
  await evalJs(`(() => {
    const set = (sel, v) => { const el = document.querySelector(sel);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('input[type=email]', ${JSON.stringify(CREDS.email)});
    set('input[type=password]', ${JSON.stringify(CREDS.password)});
    document.querySelector('input[type=password]').closest('form').requestSubmit(); })()`);
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    if (!(await evalJs("!!document.querySelector('input[type=password]')"))) return "signed-in";
  }
  return "FAILED: " + ((await evalJs("document.body.innerText"))?.match(/Invalid[^\n]*|error[^\n]{0,80}/i)?.[0] ?? "login form still visible");
};

const report = { url: URL, when: new Date().toISOString(), realWrites: REAL_WRITES, viewports: {}, login: {} };
for (const [vp, [w, h, mobile]] of Object.entries(VIEWPORTS)) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send("Page.navigate", { url: URL });
  await sleep(6000);
  report.login[vp] = await login();
  await sleep(3000);
  const views = {};
  for (const [id, label] of VIEWS) {
    let res = await click(label);
    if (res === "NOT FOUND" && mobile) { await click("Menu"); await click("Open"); await sleep(400); res = await click(label); }
    await sleep(1500);
    await shot(`${vp}-${id}`);
    views[id] = { click: res, horizontalOverflow: await overflowX(), text: (await visibleText())?.slice(0, 2500) };
  }
  report.viewports[vp] = views;
}

// Flujo Dispensar (escritorio)
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await click("Dispenser"); await sleep(1000);
const btn = (await click("EXTRACT")) === "ok" ? "EXTRACT" : await click("DISPENSE");
await sleep(4500);
await shot("flow-after-dispense");
report.dispenseFlow = { button: btn, after: (await visibleText())?.slice(0, 1500) };
// Pods reutilizables: el pod extraído se puede recargar (escritura interceptada).
// Selecciona el pod recién extraído (botón de la grilla) para ver la opción de recarga.
const extractedPod = (report.dispenseFlow.after?.match(/Seed Pod \[([A-Z]{2,4}-GEN\d+-\d+)\]/i) || [])[1];
if (extractedPod) { await click(extractedPod); await sleep(800); }
report.dispenseFlow.reload = await click("RELOAD POD");
await sleep(1500);
await shot("flow-after-reload");
report.dispenseFlow.has3D = await evalJs("!!document.querySelector('figure canvas, figure [role=img]')");
await click("Plant Status"); await sleep(REAL_WRITES ? 17000 : 1500);
await shot("flow-plant-status");
report.dispenseFlow.plantStatus = (await visibleText())?.slice(0, 1500);

report.issues = issues;
const SCENE = "DEEP SPACE TRANSIT // ISS-PROVEN VEGGIE BIO-BAY";
// Solo cuentan los errores HTTP de la app y de Supabase; los de extensiones del navegador
// (p. ej. mellowtel) se listan aparte. El aviso "no se actualizó" lo provoca la intercepción.
const appHost = new globalThis.URL(URL).host;
const isApp = (line) => line.includes(appHost) || line.includes(".supabase.co");
const expectedWarning = (line) => !REAL_WRITES && /no se actualizó/.test(line);
report.issues.httpExternal = issues.http.filter((l) => !isApp(l));
report.issues.consoleExpected = issues.console.filter(expectedWarning);
report.summary = {
  login: report.login,
  sceneVisible: Object.fromEntries(Object.entries(report.viewports).map(([vp, v]) => [vp, (v.astronaut?.text ?? "").includes(SCENE)])),
  consoleErrors: issues.console.filter((l) => !expectedWarning(l)).length,
  exceptions: issues.exceptions.length,
  httpErrors: issues.http.filter(isApp).length,
  httpExternalIgnored: report.issues.httpExternal.length,
  postsIntercepted: issues.intercepted.length,
  viewsNotFound: Object.entries(report.viewports).flatMap(([vp, v]) => Object.entries(v).filter(([, x]) => x.click === "NOT FOUND").map(([k]) => `${vp}/${k}`)),
  horizontalOverflow: Object.entries(report.viewports).flatMap(([vp, v]) => Object.entries(v).filter(([, x]) => x.horizontalOverflow).map(([k]) => `${vp}/${k}`)),
};
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
console.log(`Capturas y report.json en ${OUT}`);
ws.close(); browser.kill();
process.exit(0);
