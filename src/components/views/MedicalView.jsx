import { AlertTriangle, CheckCircle2, Leaf, ShieldAlert, Sparkles } from 'lucide-react';
import { vitalSigns } from '../../data/mockData';

export default function MedicalView({ alerts, prescriptions = [], onGoToDispenser }) {
  const activeAlerts = Array.isArray(alerts) ? alerts : [vitalSigns.cortisol, vitalSigns.vitamins];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Active Clinical Alerts */}
      <section
        aria-label="Active Clinical Alerts"
        role="alert"
        aria-live="polite"
        className="rounded-2xl border border-slate-800 bg-[#0B0F17] p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-red-400 uppercase">
              Biometric Diagnostics
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-100">
              Active Clinical Alerts ({activeAlerts.length})
            </h2>
          </div>
          <span className="rounded-md border border-slate-700 bg-[#080D17] px-2.5 py-1 font-mono text-xs text-slate-300">
            AUTONOMOUS REVIEW
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-4 text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>No active clinical alerts. All biomarkers are within nominal range.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeAlerts.map((alertItem, idx) => {
              const Icon = idx % 2 === 0 ? AlertTriangle : ShieldAlert;
              const isCritical = alertItem.status === 'CRITICAL';
              return (
                <article
                  key={alertItem.id || idx}
                  className="animate-alert-beacon flex flex-wrap items-start justify-between gap-4 rounded-xl border border-red-500/60 bg-red-950/35 p-4"
                >
                  <div className="flex items-start gap-3.5">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-mono text-xs font-bold tracking-wider text-red-100 uppercase">
                          {alertItem.alertTitle}
                        </h3>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold text-white ${
                            isCritical ? 'bg-red-600' : 'bg-red-500'
                          }`}
                        >
                          {alertItem.status}
                        </span>
                      </div>
                      {alertItem.alertDetail && (
                        <p className="mt-1.5 text-sm text-red-100/85">{alertItem.alertDetail}</p>
                      )}
                      {alertItem.referenceRange && (
                        <p className="mt-1.5 font-mono text-xs text-red-300/80">
                          REF RANGE: {alertItem.referenceRange}
                        </p>
                      )}
                    </div>
                  </div>

                  {alertItem.value && (
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-2xl font-bold text-red-200 tabular-nums">
                        {alertItem.value}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Living Pharmacy Prescriptions */}
      <section
        aria-label="Living Pharmacy - Automated Botanical Prescription"
        className="rounded-2xl border border-slate-800 bg-[#0B0F17] p-6"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-400/10 text-emerald-300">
              <Leaf className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase">
                Living Pharmacy
              </p>
              <h2 className="text-lg font-bold text-slate-100">
                Automated Botanical Prescription
              </h2>
            </div>
          </div>

          {onGoToDispenser && prescriptions.length > 0 && (
            <button
              type="button"
              onClick={onGoToDispenser}
              className="cursor-pointer rounded-lg border border-sky-400/45 bg-sky-400/10 px-3.5 py-2 font-mono text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-400/20 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              Go to Dispenser →
            </button>
          )}
        </div>

        {prescriptions.length === 0 ? (
          <p className="text-sm text-slate-400">
            No active alerts · no botanical prescription required in this cycle.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {prescriptions.map((rx) => (
              <article
                key={rx.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-[#080D17] p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-md border border-amber-500/40 bg-amber-950/35 px-2.5 py-1 font-mono text-[11px] font-semibold text-amber-200">
                      {rx.trigger}
                    </span>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {rx.triggerValue}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-100">{rx.plant}</h3>
                  <p className="text-xs italic text-slate-400">{rx.latin}</p>
                  <p className="mt-2.5 text-sm text-slate-300">{rx.effect}</p>

                  {(rx.compound || rx.dose) && (
                    <dl className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-slate-800/80 bg-[#0C1320] p-3 text-xs">
                      {rx.compound && (
                        <div className="flex justify-between gap-3">
                          <dt className="font-mono text-slate-500">COMPOUND</dt>
                          <dd className="text-right font-medium text-slate-200">{rx.compound}</dd>
                        </div>
                      )}
                      {rx.dose && (
                        <div className="flex justify-between gap-3">
                          <dt className="font-mono text-slate-500">DOSE</dt>
                          <dd className="text-right font-medium text-slate-200">{rx.dose}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-3.5">
                  <div
                    className={`flex items-center gap-2 font-mono text-[11px] ${
                      rx.nasaBacked ? 'text-emerald-300' : 'text-amber-200'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {rx.nasaBacked ? 'NASA BACKED' : 'NOT FLIGHT-VALIDATED · CLINICAL EVIDENCE'}
                      {rx.evidence ? ` · ${rx.evidence}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500">HARVEST TIME</span>
                    <span className="font-bold text-sky-300 tabular-nums">
                      {rx.harvestDays} DAYS
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
