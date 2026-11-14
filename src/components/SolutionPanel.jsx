import { useEffect, useRef, useState } from "react";

/**
 * SolutionPanel — Módulo autocontenido (Living Pharmacy + Genetic Seed Vault Audit).
 *
 * - Sin dependencias externas aparte de React (estilos incluidos, prefijo `sp-`).
 * - Funciona sin props usando DEFAULT_DATA; opcionalmente recibe `data`
 *   con la misma forma que src/data/mockData.js.
 * - `onDispensed` (opcional) se llama cuando el cartucho queda listo.
 *
 * Uso:  <SolutionPanel />   o   <SolutionPanel data={solutionData} onDispensed={fn} />
 */

const DEFAULT_DATA = {
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

const DISPENSE_MS = 2200; // duración de la barra de progreso (rápida para el video)

export default function SolutionPanel({ data = DEFAULT_DATA, onDispensed }) {
  const { crew, prescriptions, seedVault, radiation } = data;
  const approved = seedVault.find((c) => c.status === "approved");
  const doseOf = (c) =>
    radiation && c.exposureDays != null
      ? Math.round(c.exposureDays * radiation.rateMsvPerDay * (c.shielding ?? 1))
      : null;

  const [phase, setPhase] = useState("idle"); // idle | dispensing | ready
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const dispense = () => {
    if (phase !== "idle") return;
    setPhase("dispensing");
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(100, ((now - start) / DISPENSE_MS) * 100);
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase("ready");
        onDispensed?.(approved);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    setPhase("idle");
    setProgress(0);
  };

  const stageText =
    progress < 35 ? "Liberando cartucho del vault…" :
    progress < 70 ? "Verificando sello criogénico…" :
    "Transfiriendo a bandeja de cultivo…";

  return (
    <section className="sp-root" aria-label="Panel de solución botánica">
      <style>{STYLES}</style>

      {/* ── Encabezado ─────────────────────────────── */}
      <header className="sp-header">
        <div>
          <div className="sp-eyebrow">SOLUTION MODULE · {crew.module}</div>
          <h2 className="sp-title">Protocolo de Respuesta Biológica</h2>
        </div>
        <div className="sp-crew">
          <span className="sp-dot sp-dot--live" /> {crew.id} · {crew.name}
          {crew.missionDay != null && radiation && (
            <span>
              · DÍA {crew.missionDay} · {Math.round(crew.missionDay * radiation.rateMsvPerDay)} mSv
            </span>
          )}
        </div>
      </header>

      {/* ── 1. Living Pharmacy ─────────────────────── */}
      <div className="sp-section">
        <div className="sp-section-head">
          <span className="sp-index">01</span>
          <h3>Living Pharmacy</h3>
          <span className="sp-sub">Receta Botánica Automática</span>
        </div>

        {prescriptions.length === 0 && (
          <div className="sp-muted sp-small">Sin alertas activas · no se requiere receta botánica.</div>
        )}
        <div className="sp-grid">
          {prescriptions.map((rx, i) => (
            <article key={rx.id} className="sp-rx" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="sp-rx-top">
                <span className="sp-chip sp-chip--alert">⚠ {rx.trigger}</span>
                <span className="sp-mono sp-muted">{rx.triggerValue}</span>
              </div>
              <div className="sp-rx-arrow">PRESCRIPCIÓN ▸</div>
              <div className="sp-rx-plant">{rx.plant}</div>
              <div className="sp-rx-latin">{rx.latin}</div>
              <div className="sp-rx-effect">{rx.effect}</div>
              {(rx.compound || rx.dose) && (
                <dl className="sp-rx-meta">
                  {rx.compound && (<><dt>COMPUESTO</dt><dd>{rx.compound}</dd></>)}
                  {rx.dose && (<><dt>DOSIS</dt><dd>{rx.dose}</dd></>)}
                </dl>
              )}
              {rx.evidence && (
                <div className={`sp-evidence ${rx.nasaBacked ? "sp-evidence--nasa" : ""}`}>
                  {rx.nasaBacked ? "◆ RESPALDO NASA" : "◇ SIN DATO NASA"} · {rx.evidence}
                </div>
              )}
              <div className="sp-rx-harvest">
                <span className="sp-muted">COSECHA EN</span>
                <span className="sp-rx-days">{rx.harvestDays}</span>
                <span className="sp-muted">DÍAS</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ── 2. Genetic Seed Vault Audit ────────────── */}
      <div className="sp-section">
        <div className="sp-section-head">
          <span className="sp-index">02</span>
          <h3>Genetic Seed Vault Audit</h3>
          <span className="sp-sub">Filtro Genético pre-siembra</span>
        </div>

        <div className="sp-grid">
          {seedVault.map((c, i) => {
            const ok = c.status === "approved";
            return (
              <article
                key={c.id}
                className={`sp-cart ${ok ? "sp-cart--ok" : "sp-cart--bad"}`}
                style={{ animationDelay: `${0.3 + i * 0.15}s` }}
              >
                <div className="sp-cart-head">
                  <div>
                    <div className="sp-cart-name">{c.cartridge}</div>
                    <div className="sp-muted sp-small">{c.plant}</div>
                  </div>
                  <div className={`sp-stamp ${ok ? "sp-stamp--ok" : "sp-stamp--bad"}`}>
                    {ok ? "✔ AUTORIZADO" : "✖ DESCARTADO"}
                  </div>
                </div>

                <div className="sp-meter">
                  <div
                    className="sp-meter-fill"
                    style={{ "--sp-w": `${c.viability}%` }}
                  />
                </div>

                <div className={`sp-badge ${ok ? "sp-badge--ok" : "sp-badge--bad"}`}>
                  VIABILIDAD: {c.viability}% - {c.label}
                </div>
                <div className="sp-muted sp-small sp-detail">{c.detail}</div>
                {doseOf(c) != null && (
                  <div className="sp-dose">
                    <span>DOSIS ACUMULADA</span>
                    <strong className={ok ? "" : "sp-dose--bad"}>{doseOf(c)} mSv</strong>
                    <span className="sp-muted">
                      {c.exposureDays} d × {radiation.rateMsvPerDay} mSv/d
                      {c.shielding !== 1 ? ` × blindaje ${c.shielding}` : ""} · {radiation.source}
                    </span>
                  </div>
                )}

                {ok && c.rxTag && <div className="sp-rxtag">{c.rxTag}</div>}
              </article>
            );
          })}
        </div>

        {/* ── Dispensador ──────────────────────────── */}
        <div className={`sp-dispense sp-dispense--${phase}`}>
          {phase === "idle" && (
            <button className="sp-btn" onClick={dispense}>
              DISPENSAR CARTUCHO GEN-2
            </button>
          )}

          {phase === "dispensing" && (
            <div className="sp-progress-wrap" role="status" aria-live="polite">
              <div className="sp-progress-label">
                <span>{stageText}</span>
                <span className="sp-mono">{Math.round(progress)}%</span>
              </div>
              <div className="sp-progress">
                <div className="sp-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {phase === "ready" && (
            <div className="sp-ready" role="status" aria-live="polite">
              <div className="sp-ready-icon">✔</div>
              <div>
                <div className="sp-ready-title">CARTUCHO LISTO PARA CULTIVO</div>
                <div className="sp-muted sp-small">
                  {approved?.rxTag} · Cosecha estimada en {(prescriptions.find((p) => p.plant === approved?.plant) ?? prescriptions[0])?.harvestDays ?? "—"} días
                </div>
              </div>
              <button className="sp-reset" onClick={reset} title="Reiniciar demo">↺</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* Estilos con prefijo `sp-` para no chocar con el CSS del proyecto base. */
const STYLES = `
.sp-root{
  --sp-bg:#05080d; --sp-panel:#0b111a; --sp-line:#1a2533; --sp-text:#e6edf5; --sp-muted:#7d8ea3;
  --sp-green:#39ff88; --sp-green-dim:rgba(57,255,136,.12);
  --sp-red:#ff3b4f; --sp-amber:#ffb020; --sp-red-dim:rgba(255,59,79,.12);
  font-family:"Inter","Segoe UI",system-ui,sans-serif; color:var(--sp-text);
  background:radial-gradient(1200px 500px at 10% -10%,rgba(57,255,136,.06),transparent 60%),var(--sp-bg);
  border:1px solid var(--sp-line); border-radius:16px; padding:28px; box-sizing:border-box;
  display:flex; flex-direction:column; gap:28px; width:100%;
}
.sp-root *{box-sizing:border-box}
.sp-mono{font-family:"JetBrains Mono","Consolas",monospace}
.sp-muted{color:var(--sp-muted)} .sp-small{font-size:12px}

.sp-header{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;
  border-bottom:1px solid var(--sp-line);padding-bottom:16px}
.sp-eyebrow{font:600 11px/1 "JetBrains Mono",Consolas,monospace;letter-spacing:.18em;color:var(--sp-green);margin-bottom:8px}
.sp-title{margin:0;font-size:24px;font-weight:700;letter-spacing:.01em}
.sp-crew{font:500 12px "JetBrains Mono",Consolas,monospace;color:var(--sp-muted);display:flex;align-items:center;gap:8px}
.sp-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.sp-dot--live{background:var(--sp-green);box-shadow:0 0 10px var(--sp-green);animation:sp-pulse 1.4s infinite}

.sp-section{display:flex;flex-direction:column;gap:16px}
.sp-section-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.sp-section-head h3{margin:0;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.sp-index{font:700 12px "JetBrains Mono",Consolas,monospace;color:var(--sp-bg);background:var(--sp-green);padding:3px 7px;border-radius:4px}
.sp-sub{color:var(--sp-muted);font-size:13px}
.sp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}

/* Living Pharmacy */
.sp-rx{position:relative;overflow:hidden;background:linear-gradient(160deg,rgba(57,255,136,.14),rgba(57,255,136,.03) 60%),var(--sp-panel);
  border:1px solid rgba(57,255,136,.55);border-radius:14px;padding:20px;
  box-shadow:0 0 0 1px rgba(57,255,136,.08) inset,0 0 28px rgba(57,255,136,.18);
  opacity:0;animation:sp-in .6s ease forwards}
.sp-rx::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(57,255,136,.12),transparent);
  transform:translateX(-100%);animation:sp-scan 3.5s ease-in-out infinite 1s;pointer-events:none}
.sp-rx-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.sp-chip{font:700 11px "JetBrains Mono",Consolas,monospace;padding:4px 8px;border-radius:999px;letter-spacing:.04em}
.sp-chip--alert{color:var(--sp-amber);background:rgba(255,176,32,.12);border:1px solid rgba(255,176,32,.5)}
.sp-rx-arrow{margin-top:16px;font:600 11px "JetBrains Mono",Consolas,monospace;letter-spacing:.2em;color:var(--sp-green)}
.sp-rx-plant{font-size:30px;font-weight:800;color:var(--sp-green);text-shadow:0 0 18px rgba(57,255,136,.55);line-height:1.1;margin-top:4px}
.sp-rx-latin{font-style:italic;color:var(--sp-muted);font-size:13px;margin-top:2px}
.sp-rx-effect{margin-top:10px;font-size:14px}
.sp-rx-meta{margin:12px 0 0;display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px}
.sp-rx-meta dt{font:600 10px/1.9 "JetBrains Mono",Consolas,monospace;letter-spacing:.14em;color:var(--sp-muted)}
.sp-rx-meta dd{margin:0}
.sp-evidence{margin-top:10px;font:600 11px/1.4 "JetBrains Mono",Consolas,monospace;color:var(--sp-muted)}
.sp-evidence--nasa{color:#7cc4ff}
.sp-dose{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;font:600 11px "JetBrains Mono",Consolas,monospace;
  letter-spacing:.06em;border-top:1px dashed var(--sp-line);padding-top:10px}
.sp-dose strong{font-size:18px;color:var(--sp-green)}
.sp-dose strong.sp-dose--bad{color:var(--sp-red)}
.sp-dose .sp-muted{flex-basis:100%;font-weight:500;letter-spacing:0}
.sp-rx-harvest{margin-top:16px;display:flex;align-items:baseline;gap:8px;font:600 11px "JetBrains Mono",Consolas,monospace;letter-spacing:.12em;
  border-top:1px dashed rgba(57,255,136,.3);padding-top:12px}
.sp-rx-days{font-size:34px;font-weight:800;color:var(--sp-text);letter-spacing:0}

/* Seed Vault */
.sp-cart{background:var(--sp-panel);border-radius:14px;padding:20px;border:1px solid var(--sp-line);
  display:flex;flex-direction:column;gap:12px;opacity:0;animation:sp-in .6s ease forwards}
.sp-cart--bad{border-color:rgba(255,59,79,.5);background:linear-gradient(160deg,var(--sp-red-dim),transparent 60%),var(--sp-panel)}
.sp-cart--bad .sp-cart-name{text-decoration:line-through;text-decoration-color:rgba(255,59,79,.7)}
.sp-cart--ok{border-color:rgba(57,255,136,.7);background:linear-gradient(160deg,var(--sp-green-dim),transparent 60%),var(--sp-panel);
  box-shadow:0 0 32px rgba(57,255,136,.22)}
.sp-cart-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.sp-cart-name{font-size:20px;font-weight:700}
.sp-stamp{font:800 11px "JetBrains Mono",Consolas,monospace;letter-spacing:.12em;padding:5px 9px;border-radius:6px;border:2px solid;transform:rotate(-3deg)}
.sp-stamp--ok{color:var(--sp-green);border-color:var(--sp-green)}
.sp-stamp--bad{color:var(--sp-red);border-color:var(--sp-red)}
.sp-meter{height:8px;background:#121b27;border-radius:999px;overflow:hidden}
.sp-meter-fill{height:100%;width:0;border-radius:999px;animation:sp-grow 1.2s cubic-bezier(.2,.8,.2,1) forwards .5s}
.sp-cart--ok .sp-meter-fill{background:var(--sp-green);box-shadow:0 0 12px var(--sp-green)}
.sp-cart--bad .sp-meter-fill{background:linear-gradient(90deg,var(--sp-red),var(--sp-amber))}
.sp-badge{font:800 13px/1.35 "JetBrains Mono",Consolas,monospace;padding:10px 12px;border-radius:8px;letter-spacing:.03em}
.sp-badge--ok{color:#03140a;background:var(--sp-green);box-shadow:0 0 18px rgba(57,255,136,.7);animation:sp-glow 2s ease-in-out infinite}
.sp-badge--bad{color:var(--sp-amber);background:var(--sp-red-dim);border:1px solid var(--sp-red);
  box-shadow:inset 3px 0 0 var(--sp-red)}
.sp-detail{line-height:1.4}
.sp-rxtag{margin-top:4px;text-align:center;font:900 clamp(20px,3.2vw,30px)/1.1 "JetBrains Mono",Consolas,monospace;letter-spacing:.06em;
  color:var(--sp-green);border:3px solid var(--sp-green);border-radius:10px;padding:14px 10px;
  text-shadow:0 0 14px rgba(57,255,136,.8);box-shadow:0 0 24px rgba(57,255,136,.3),inset 0 0 24px rgba(57,255,136,.12)}

/* Dispensador */
.sp-dispense{min-height:92px;display:flex;align-items:center;justify-content:center;
  border:1px dashed var(--sp-line);border-radius:14px;padding:16px}
.sp-dispense--ready{border-style:solid;border-color:var(--sp-green);background:var(--sp-green-dim)}
.sp-btn{width:100%;max-width:560px;font:800 clamp(16px,2.2vw,22px) "JetBrains Mono",Consolas,monospace;letter-spacing:.1em;
  color:#03140a;background:var(--sp-green);border:none;border-radius:12px;padding:20px 24px;cursor:pointer;
  box-shadow:0 0 30px rgba(57,255,136,.55);transition:transform .12s ease,box-shadow .2s ease;animation:sp-glow 2s ease-in-out infinite}
.sp-btn:hover{transform:translateY(-2px);box-shadow:0 0 44px rgba(57,255,136,.85)}
.sp-btn:active{transform:translateY(1px) scale(.99)}
.sp-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
.sp-progress-wrap{width:100%;max-width:560px}
.sp-progress-label{display:flex;justify-content:space-between;font:600 13px "JetBrains Mono",Consolas,monospace;color:var(--sp-green);margin-bottom:10px}
.sp-progress{height:18px;background:#0f1822;border:1px solid rgba(57,255,136,.4);border-radius:999px;overflow:hidden}
.sp-progress-fill{height:100%;background:repeating-linear-gradient(45deg,var(--sp-green) 0 12px,#2bd873 12px 24px);
  background-size:34px 34px;animation:sp-stripes .6s linear infinite;box-shadow:0 0 16px var(--sp-green)}
.sp-ready{width:100%;display:flex;align-items:center;gap:16px;animation:sp-pop .45s cubic-bezier(.2,1.4,.4,1)}
.sp-ready-icon{flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:26px;font-weight:900;
  color:#03140a;background:var(--sp-green);box-shadow:0 0 26px var(--sp-green)}
.sp-ready-title{font:900 clamp(18px,2.6vw,26px) "JetBrains Mono",Consolas,monospace;letter-spacing:.06em;color:var(--sp-green);
  text-shadow:0 0 14px rgba(57,255,136,.7)}
.sp-reset{margin-left:auto;background:transparent;border:1px solid var(--sp-line);color:var(--sp-muted);border-radius:8px;
  width:36px;height:36px;cursor:pointer;font-size:18px}
.sp-reset:hover{color:var(--sp-text);border-color:var(--sp-muted)}

@keyframes sp-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes sp-grow{to{width:var(--sp-w)}}
@keyframes sp-pulse{50%{opacity:.35}}
@keyframes sp-glow{50%{box-shadow:0 0 8px rgba(57,255,136,.35)}}
@keyframes sp-scan{0%{transform:translateX(-100%)}60%,100%{transform:translateX(100%)}}
@keyframes sp-stripes{to{background-position:34px 0}}
@keyframes sp-pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}

@media (max-width:520px){.sp-root{padding:16px}.sp-rx-plant{font-size:24px}}
@media (prefers-reduced-motion:reduce){.sp-root *,.sp-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`;
