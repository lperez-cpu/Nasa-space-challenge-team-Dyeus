// Project E.D.E.N. — prueba de punta a punta con Edge/Chrome headless (Chrome DevTools Protocol).
// Sin dependencias: Node 22+ (fetch y WebSocket globales).
//
//   node tests/e2e.mjs [url] [carpeta-salida]
//   node tests/e2e.mjs https://nasa-space-challenge-team-dyeus.vercel.app out/e2e
//
// - Recorre las 5 ventanas en escritorio (1440x900) y celular (390x844) y saca capturas.
// - Prueba el flujo Dispensar. Los POST a dispense_log se INTERCEPTAN (respuesta 201 falsa):
//   la base real no se toca. Con REAL_WRITES=1 se deja pasar la escritura.
// - Registra errores de consola, excepciones y respuestas HTTP >= 400.
// - Escribe report.json con el texto visible de cada pantalla y un resumen de fallas.
// Variable BROWSER para otro navegador (por defecto Edge en Windows).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const URL = process.argv[2] ?? "http://localhost:5173/";
const OUT = resolve(process.argv[3] ?? "out/e2e");
const BROWSER = process.env.BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const REAL_WRITES = process.env.REAL_WRITES === "1";
const PORT = 9300 + Math.floor(Math.random() * 500);
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  ["astronaut", "Astronaut Data"],
  ["medical", "Medical Consultation"],
  ["dispenser", "Dispenser"],
  ["inventory", "Capsule Inventory"],
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
  if (msg.method === "Runtime.exceptionThrown") issues.exceptions.push(p.exceptionDetails.exception?.description?.slice(0, 300));
  if (msg.method === "Network.responseReceived" && p.response.status >= 400)
    issues.http.push(`${p.response.status} ${p.response.url.slice(0, 160)}`);
  if (msg.method === "Fetch.requestPaused") {
    const rq = p.request;
    if (rq.method !== "POST" || REAL_WRITES) { send("Fetch.continueRequest", { requestId: p.requestId }); return; }
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
await send("Fetch.enable", { patterns: [{ urlPattern: "*dispense_log*", requestStage: "Request" }] });

const report = { url: URL, when: new Date().toISOString(), realWrites: REAL_WRITES, viewports: {} };
for (const [vp, [w, h, mobile]] of Object.entries(VIEWPORTS)) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send("Page.navigate", { url: URL });
  await sleep(7000);
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
await click("Plant Status"); await sleep(REAL_WRITES ? 17000 : 1500);
await shot("flow-plant-status");
report.dispenseFlow.plantStatus = (await visibleText())?.slice(0, 1500);

report.issues = issues;
report.summary = {
  consoleErrors: issues.console.length, exceptions: issues.exceptions.length, httpErrors: issues.http.length,
  postsIntercepted: issues.intercepted.length,
  viewsNotFound: Object.entries(report.viewports).flatMap(([vp, v]) => Object.entries(v).filter(([, x]) => x.click === "NOT FOUND").map(([k]) => `${vp}/${k}`)),
  horizontalOverflow: Object.entries(report.viewports).flatMap(([vp, v]) => Object.entries(v).filter(([, x]) => x.horizontalOverflow).map(([k]) => `${vp}/${k}`)),
};
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
console.log(`Capturas y report.json en ${OUT}`);
ws.close(); browser.kill();
process.exit(0);
