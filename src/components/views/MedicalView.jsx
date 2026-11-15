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
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-red-600 uppercase">
              Biometric Diagnostics
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-[#0F172A]">
              Active Clinical Alerts ({activeAlerts.length})
            </h2>
          </div>
          <span className="rounded-md border border-slate-200 bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
            AUTONOMOUS REVIEW
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
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
                  className="animate-alert-beacon flex flex-wrap items-start justify-between gap-4 rounded-lg border border-red-300 bg-red-50 p-4"
                >
                  <div className="flex items-start gap-3.5">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-mono text-xs font-bold tracking-wider text-red-950 uppercase">
                          {alertItem.alertTitle}
                        </h3>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-xs font-bold text-white ${
                            isCritical ? 'bg-red-700' : 'bg-red-600'
                          }`}
                        >
                          {alertItem.status}
                        </span>
                      </div>
                      {alertItem.alertDetail && (
                        <p className="mt-1.5 text-sm text-red-900">{alertItem.alertDetail}</p>
                      )}
                      {alertItem.referenceRange && (
                        <p className="mt-1.5 font-mono text-xs text-red-700">
                          REF RANGE: {alertItem.referenceRange}
                        </p>
                      )}
                      {alertItem.source && (
                        <p className="mt-1 font-mono text-xs text-red-800/80">
                          Data source: {alertItem.source}
                          {alertItem.sourceSimulated ? ' · simulated feed' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {alertItem.value &&
                    alertItem.value.toUpperCase() !== String(alertItem.status).toUpperCase() &&
                    !String(alertItem.alertTitle).toUpperCase().includes(String(alertItem.value).toUpperCase()) && (
                      <div className="shrink-0 text-right">
                        <span className="font-mono text-2xl font-bold text-red-700 tabular-nums">
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

      {/* 2. Dietary Therapeutics (Food as Medicine) */}
      <section
        aria-label="Dietary Therapeutics - Food as Medicine"
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Leaf className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.16em] text-emerald-700 uppercase">
                Dietary Therapeutics · Food as Medicine
              </p>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Therapeutic Nutrition Recommendation
              </h2>
            </div>
          </div>

          {onGoToDispenser && prescriptions.length > 0 && (
            <button
              type="button"
              onClick={onGoToDispenser}
              className="cursor-pointer rounded-md bg-[#E14D2A] px-3.5 py-2 font-mono text-xs font-bold text-white transition-colors hover:bg-[#c94120] focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
            >
              Select Seed Pod →
            </button>
          )}
        </div>

        {prescriptions.length === 0 ? (
          <p className="text-sm text-slate-600">
            {activeAlerts.length > 0
              ? 'Alerts detected · no matching crop in the botanical registry.'
              : 'No active alerts · no dietary therapeutic crop required in this cycle.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {prescriptions.map((rx) => (
              <article
                key={rx.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-[#F8FAFC] p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-900">
                      {rx.trigger}
                    </span>
                    <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
                      {rx.triggerValue}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-[#0F172A]">{rx.plant}</h3>
                  <p className="text-xs italic text-slate-500">{rx.latin}</p>
                  <p className="mt-2.5 text-sm text-slate-700">{rx.effect}</p>

                  {(rx.compound || rx.dose || rx.consumptionMethod) && (
                    <dl className="mt-4 grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-3 text-xs">
                      {rx.compound && (
                        <div className="flex justify-between gap-3">
                          <dt className="font-mono text-slate-500">BIOACTIVE NUTRIENT</dt>
                          <dd className="text-right font-semibold text-[#0F172A]">{rx.compound}</dd>
                        </div>
                      )}
                      {rx.dose && (
                        <div className="flex justify-between gap-3">
                          <dt className="font-mono text-slate-500">SERVING / PORTION</dt>
                          <dd className="text-right font-semibold text-[#0F172A]">{rx.dose}</dd>
                        </div>
                      )}
                      {rx.consumptionMethod && (
                        <div className="flex justify-between gap-3">
                          <dt className="font-mono text-slate-500">ISS CONSUMPTION</dt>
                          <dd className="text-right font-semibold text-emerald-700">{rx.consumptionMethod}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 border-t border-slate-200 pt-3.5">
                  <div
                    className={`flex items-center gap-2 font-mono text-[11px] font-semibold ${
                      rx.nasaBacked ? 'text-emerald-700' : 'text-amber-800'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {rx.nasaBacked ? 'NASA BACKED' : 'NOT FLIGHT-VALIDATED · CLINICAL EVIDENCE'}
                      {rx.evidence ? ` · ${rx.evidence}` : ''}
                    </span>
                  </div>

                  {rx.habitatLabel && (
                    <p className="font-mono text-[10px] text-slate-500">{rx.habitatLabel}</p>
                  )}

                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500">HARVEST TIME</span>
                    <span className="font-bold text-[#0284C7] tabular-nums">
                      {rx.harvestDays} DAYS
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 3. Natural Consumption Protocol (Zero Chemical Synthesis) */}
      <section
        aria-label="Natural Consumption Protocol"
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#0284C7] uppercase">
              Zero Chemical Synthesis · ISS Hardware Only
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-[#0F172A]">
              Natural Consumption Protocol
            </h2>
          </div>
          <span className="rounded-md border border-slate-200 bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
            NO PHARMA LAB REQUIRED
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
            <p className="font-mono text-[11px] font-bold tracking-wider text-[#E14D2A] uppercase">
              01 · Infusion (Space Tea)
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Cut harvested leaves and rehydrate in a sealed drink pouch using the existing ISS hot water dispenser.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
            <p className="font-mono text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
              02 · Direct Consumption
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Harvest fresh raw leaves from the Veggie tray and consume directly alongside the daily crew meal ration.
            </p>
          </div>
          <div className="rounded-lg border border-dashed border-slate-300 bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                03 · Dehydrated Powder
              </p>
              <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-700 uppercase">
                Next step
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Next step (future deep-space module): dehydrate harvested leaves into botanical powder
              for nutritional shakes once orbital crop drying hardware is aboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
