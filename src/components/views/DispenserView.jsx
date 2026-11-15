import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FlaskConical, RotateCcw, ShieldCheck } from 'lucide-react';

const DISPENSE_MS = 2200;

export default function DispenserView({
  crew,
  prescriptions = [],
  seedVault = [],
  onDispensed,
}) {
  const approved =
    prescriptions.length > 0
      ? seedVault.find((c) => c.status === 'approved') ?? null
      : null;
  const matchingRx =
    prescriptions.find((p) => p.plant === approved?.plant) ?? prescriptions[0];

  const [phase, setPhase] = useState('idle'); // idle | dispensing | ready
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const dispense = () => {
    if (phase !== 'idle' || !approved) return;
    setPhase('dispensing');
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min(100, ((now - start) / DISPENSE_MS) * 100);
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase('ready');
        onDispensed?.(approved);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    setPhase('idle');
    setProgress(0);
  };

  const stageText =
    progress < 35
      ? 'Unlocking Seed Pod from vault...'
      : progress < 70
        ? 'Verifying radiation-free seal...'
        : 'Preparing manual Veggie extraction...';

  const podCode = approved?.id?.toUpperCase() || approved?.cartridge?.toUpperCase() || 'POD-GEN2';

  return (
    <section
      aria-label="Seed Pod Dispenser"
      className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E14D2A]/10 text-[#E14D2A]">
            <FlaskConical className="h-4 w-4" />
          </span>
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#E14D2A] uppercase">
              ISS Veggie Plug &amp; Play · {crew?.module || 'HAB-2 / Bio-Lab'}
            </p>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Seed Pod Extraction &amp; Loading
            </h2>
          </div>
        </div>

        <span className="rounded-md border border-slate-200 bg-[#F8FAFC] px-3 py-1 font-mono text-xs font-medium text-slate-700">
          {crew?.id} · {crew?.name}
        </span>
      </div>

      {/* Authorized Seed Pod Summary + Anatomy */}
      {approved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-white text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                  Action Required · Extract Seed Pod [{podCode}]
                </p>
                <h3 className="mt-0.5 text-xl font-bold text-[#0F172A]">
                  {approved.cartridge} · {approved.plant}
                </h3>
                <p className="mt-1 text-sm text-slate-700">{approved.detail}</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <p className="text-[11px] font-semibold text-slate-500">GENOMIC VIABILITY</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                {approved.viability}%
              </p>
            </div>
          </div>

          {/* Seed Pod 3-part composition */}
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-md border border-emerald-200 bg-white px-3 py-2">
              <p className="font-mono text-[10px] font-bold text-slate-500 uppercase">01 · Cultivar</p>
              <p className="mt-0.5 text-xs font-semibold text-[#0F172A]">
                {approved.plant} (Radiation-Cleared)
              </p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-white px-3 py-2">
              <p className="font-mono text-[10px] font-bold text-slate-500 uppercase">02 · Growth Medium</p>
              <p className="mt-0.5 text-xs font-semibold text-[#0F172A]">
                0-G Synthetic Root Substrate
              </p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-white px-3 py-2">
              <p className="font-mono text-[10px] font-bold text-slate-500 uppercase">03 · Dry Matrix</p>
              <p className="mt-0.5 text-xs font-semibold text-[#0F172A]">
                Hydration-Ready Nutrients
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200/80 pt-4 font-mono text-xs">
            <span className="rounded border border-emerald-300 bg-white px-2.5 py-1 font-semibold text-emerald-800">
              {approved.rxTag || `POD: ${podCode}`}
            </span>
            <span className="text-slate-600">
              Estimated harvest:{' '}
              <strong className="text-[#0F172A] tabular-nums">
                {matchingRx?.harvestDays ?? '—'} days
              </strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5 text-sm font-medium text-slate-700">
          {prescriptions.length === 0
            ? 'No Seed Pod required — no active therapeutic recommendation in this cycle.'
            : 'No radiation-cleared Seed Pod is currently available in the Seed Vault.'}
        </div>
      )}

      {/* Plug & Play Extraction Action Area */}
      {approved && (
        <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5">
          {phase === 'idle' && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <p className="max-w-lg text-sm text-slate-600">
                Extract Seed Pod <strong className="font-mono text-[#0F172A]">[{podCode}]</strong>{' '}
                from the vault, plug it into the existing <strong>NASA Veggie Module</strong>, and
                inject water to begin growth ({matchingRx?.harvestDays ?? '—'} days to harvest,{' '}
                {matchingRx?.dose || 'therapeutic serving'}). Logged to crew health record.
              </p>
              <button
                type="button"
                onClick={dispense}
                className="w-full max-w-md cursor-pointer rounded-md bg-[#E14D2A] px-6 py-4 font-mono text-sm font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#c94120] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E14D2A]"
              >
                EXTRACT SEED POD [{podCode}]
              </button>
            </div>
          )}

        {phase === 'dispensing' && (
          <div className="flex flex-col gap-3 py-3" role="status" aria-live="polite">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-semibold text-[#0F172A]">{stageText}</span>
              <span className="font-bold text-[#E14D2A] tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#E14D2A] transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {phase === 'ready' && (
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3.5">
              <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" />
              <div>
                <h3 className="font-mono text-sm font-bold tracking-wide text-emerald-900 uppercase">
                  Seed Pod [{podCode}] Extracted · Plug into Veggie &amp; Hydrate
                </h3>
                <p className="mt-0.5 text-xs text-emerald-800">
                  {approved?.rxTag} · Insert into NASA Veggie tray, inject water · Harvest in{' '}
                  {matchingRx?.harvestDays ?? '—'} days
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              title="Reset extraction workflow"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-[#0F172A] transition-colors hover:border-[#E14D2A] hover:text-[#E14D2A] focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
        </div>
      )}
    </section>
  );
}
