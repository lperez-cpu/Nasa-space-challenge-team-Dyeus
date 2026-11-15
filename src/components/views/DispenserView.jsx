import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FlaskConical, Lock, ShieldCheck } from 'lucide-react';

const DISPENSE_MS = 2200;

const norm = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export default function DispenserView({
  crew,
  prescriptions = [],
  seedVault = [],
  seedPods = [],
  dispenseHistory = [],
  localDispensed = [],
  extractedPodIds = [],
  onDispensed,
}) {
  const vaultApproved = seedVault.find((c) => c.status === 'approved');

  // Build full selectable Seed Pod list from real inventory (seedPods) or active prescriptions
  const podOptions = useMemo(() => {
    const activeRxNames = new Set(prescriptions.map((p) => norm(p.plant)));
    const historyKeys = new Set([
      ...extractedPodIds.map((id) => String(id).toUpperCase()),
      ...localDispensed.map((d) => String(d.cartridge_id || '').toUpperCase()),
    ]);

    if (seedPods.length > 0) {
      const usable = seedPods.filter(
        (p) => p.podId && p.plant && p.status !== 'harvested' && p.status !== 'empty',
      );
      const mapped = usable.map((p) => {
        const isRx = activeRxNames.has(norm(p.plant));
        const auditMatch =
          vaultApproved && norm(vaultApproved.plant) === norm(p.plant) ? vaultApproved : null;
        const alreadyOut =
          p.status === 'growing' ||
          p.status === 'planted' ||
          historyKeys.has(String(p.podId).toUpperCase());

        return {
          id: p.podId,
          podId: p.podId,
          cartridge: `Seed Pod ${p.podId}`,
          plant: p.plant,
          slot: p.slot || null,
          podStatus: p.status,
          isRecommended: isRx,
          isExtracted: alreadyOut,
          viability: auditMatch?.viability ?? 99.8,
          detail:
            auditMatch?.detail ||
            `Radiation-screened ${p.plant} Seed Pod${p.slot ? ` · Vault Slot ${p.slot}` : ''}.`,
          rxTag: `RX: ${p.plant.toUpperCase()} · ${String(p.podId).toUpperCase()}`,
        };
      });

      // Recommended prescriptions first, then ready pods, then already extracted
      return mapped.sort((a, b) => {
        if (a.isExtracted !== b.isExtracted) return a.isExtracted ? 1 : -1;
        if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
        return a.plant.localeCompare(b.plant);
      });
    }

    // Fallback when running without live seedPods inventory: one pod per active prescription
    if (prescriptions.length > 0) {
      return prescriptions.map((rx, idx) => {
        const prefix = norm(rx.plant).replace(/[^a-z]/g, '').slice(0, 3).toUpperCase() || 'POD';
        const fallbackId =
          idx === 0 && vaultApproved?.id ? vaultApproved.id : `${prefix}-Gen2-001`;
        const alreadyOut =
          historyKeys.has(String(fallbackId).toUpperCase()) ||
          dispenseHistory.some((d) => norm(d.plant) === norm(rx.plant));

        return {
          id: fallbackId,
          podId: fallbackId,
          cartridge: `Seed Pod ${fallbackId}`,
          plant: rx.plant,
          slot: null,
          podStatus: alreadyOut ? 'growing' : 'ready',
          isRecommended: true,
          isExtracted: alreadyOut,
          viability: vaultApproved?.viability ?? 99.8,
          detail:
            vaultApproved?.detail ||
            `Radiation-screened ${rx.plant} Seed Pod ready for Veggie insertion.`,
          rxTag: `RX: ${rx.plant.toUpperCase()} · ${fallbackId.toUpperCase()}`,
        };
      });
    }

    return [];
  }, [seedPods, prescriptions, vaultApproved, extractedPodIds, localDispensed, dispenseHistory]);

  const [selectedPodId, setSelectedPodId] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | dispensing | ready
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Keep selectedPodId valid and default to first available (not extracted) pod
  useEffect(() => {
    if (podOptions.length === 0) {
      setSelectedPodId(null);
      return;
    }
    const stillExists = podOptions.some((p) => p.id === selectedPodId);
    if (!stillExists) {
      const firstReady = podOptions.find((p) => !p.isExtracted) || podOptions[0];
      setSelectedPodId(firstReady.id);
    }
  }, [podOptions, selectedPodId]);

  const selectedPod = podOptions.find((p) => p.id === selectedPodId) || podOptions[0] || null;
  const remainingCount = podOptions.filter((p) => !p.isExtracted).length;
  const matchingRx =
    prescriptions.find((p) => norm(p.plant) === norm(selectedPod?.plant)) ?? prescriptions[0];

  const handleSelectPod = (podId) => {
    if (phase === 'dispensing') return;
    setSelectedPodId(podId);
    setPhase('idle');
    setProgress(0);
  };

  const dispense = () => {
    if (phase !== 'idle' || !selectedPod || selectedPod.isExtracted) return;
    setPhase('dispensing');
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min(100, ((now - start) / DISPENSE_MS) * 100);
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase('ready');
        onDispensed?.(selectedPod);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const selectNextAvailable = () => {
    const nextReady = podOptions.find((p) => !p.isExtracted && p.id !== selectedPod?.id);
    if (nextReady) {
      setSelectedPodId(nextReady.id);
    }
    setPhase('idle');
    setProgress(0);
  };

  const stageText =
    progress < 35
      ? 'Unlocking Seed Pod from vault...'
      : progress < 70
        ? 'Verifying radiation-free seal...'
        : 'Preparing manual Veggie extraction...';

  const podCode = selectedPod?.podId?.toUpperCase() || selectedPod?.id?.toUpperCase() || 'POD';

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
            <p className="font-mono text-xs font-bold tracking-[0.16em] text-[#E14D2A] uppercase">
              ISS Veggie Plug &amp; Play · {crew?.module || 'HAB-2 / Bio-Lab'}
            </p>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Seed Pod Extraction &amp; Loading
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-[#F8FAFC] px-3 py-1 font-mono text-xs font-semibold text-slate-700">
            AVAILABLE PODS: {remainingCount}/{podOptions.length}
          </span>
          <span className="rounded-md border border-slate-200 bg-[#F8FAFC] px-3 py-1 font-mono text-xs font-medium text-slate-700">
            {crew?.id} · {crew?.name}
          </span>
        </div>
      </div>

      {/* Multi-Species Seed Pod Selector */}
      {podOptions.length > 0 && (
        <div>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
              Select Seed Pod from Vault ({remainingCount} ready for extraction)
            </p>
            <div className="flex items-center gap-3 font-mono text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available
              </span>
              <span className="flex items-center gap-1.5 text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Unavailable
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {podOptions.map((pod) => {
              const isSelected = selectedPod?.id === pod.id;
              return (
                <button
                  key={pod.id}
                  type="button"
                  onClick={() => handleSelectPod(pod.id)}
                  disabled={phase === 'dispensing'}
                  className={`flex cursor-pointer flex-col items-start gap-1.5 rounded-lg p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#E14D2A] disabled:cursor-not-allowed ${
                    pod.isExtracted
                      ? isSelected
                        ? 'border-2 border-red-500 bg-red-50/90 shadow-xs'
                        : 'border border-red-400 bg-red-50/50 hover:border-red-500'
                      : isSelected
                        ? 'border-2 border-emerald-600 bg-emerald-50/80 shadow-xs'
                        : 'border border-emerald-400 bg-emerald-50/35 hover:border-emerald-600'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F172A]">
                      {pod.podId}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        pod.isExtracted
                          ? 'border-red-300 bg-red-100 text-red-800'
                          : pod.isRecommended
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {pod.isExtracted ? 'EXTRACTED' : pod.isRecommended ? 'RECOMMENDED' : 'READY'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#0F172A]">{pod.plant}</span>
                  {pod.slot && (
                    <span className="font-mono text-[11px] text-slate-600">Slot {pod.slot}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Seed Pod Summary + Anatomy */}
      {selectedPod ? (
        <div
          className={`rounded-lg border-2 p-5 ${
            selectedPod.isExtracted
              ? 'border-red-400 bg-red-50/50'
              : 'border-emerald-500 bg-emerald-50/60'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-white ${
                  selectedPod.isExtracted
                    ? 'border-red-300 text-red-600'
                    : 'border-emerald-300 text-emerald-700'
                }`}
              >
                {selectedPod.isExtracted ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </span>
              <div>
                <p
                  className={`font-mono text-xs font-bold tracking-wider uppercase ${
                    selectedPod.isExtracted ? 'text-red-700' : 'text-emerald-800'
                  }`}
                >
                  {selectedPod.isExtracted
                    ? `Seed Pod [${podCode}] Already Extracted`
                    : `Action Required · Extract Seed Pod [${podCode}]`}
                </p>
                <h3 className="mt-0.5 text-xl font-bold text-[#0F172A]">
                  {selectedPod.cartridge} · {selectedPod.plant}
                </h3>
                <p className="mt-1 text-sm text-slate-700">{selectedPod.detail}</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <p className="text-xs font-semibold text-slate-500">GENOMIC VIABILITY</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                {selectedPod.viability}%
              </p>
            </div>
          </div>

          {/* Seed Pod 3-part composition */}
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                01 · Cultivar
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#0F172A]">
                {selectedPod.plant} (Radiation-Cleared)
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                02 · Growth Medium
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#0F172A]">
                0-G Synthetic Root Substrate
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                03 · Dry Matrix
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#0F172A]">
                Hydration-Ready Nutrients
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 font-mono text-xs">
            <span className="rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-800">
              {selectedPod.rxTag}
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
          No Seed Pod required — no active therapeutic recommendation or available inventory in this
          cycle.
        </div>
      )}

      {/* Plug & Play Extraction Action Area */}
      {selectedPod && (
        <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5">
          {phase === 'idle' && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              {selectedPod.isExtracted ? (
                <>
                  <p className="max-w-lg text-sm text-slate-600">
                    Seed Pod <strong className="font-mono text-[#0F172A]">[{podCode}]</strong> has
                    already been extracted for Veggie cultivation.{' '}
                    {remainingCount > 0
                      ? 'Select another ready Seed Pod above to prepare a different species.'
                      : 'All available Seed Pods in the vault are currently in cultivation.'}
                  </p>
                  <button
                    type="button"
                    disabled
                    className="w-full max-w-md cursor-not-allowed rounded-md bg-slate-300 px-6 py-4 font-mono text-sm font-bold tracking-wider text-slate-600 uppercase"
                  >
                    SEED POD [{podCode}] ALREADY EXTRACTED
                  </button>
                </>
              ) : (
                <>
                  <p className="max-w-lg text-sm text-slate-600">
                    Extract Seed Pod{' '}
                    <strong className="font-mono text-[#0F172A]">[{podCode}]</strong> from the
                    vault, plug it into the existing <strong>NASA Veggie Module</strong>, and inject
                    water to begin growth ({matchingRx?.harvestDays ?? '—'} days to harvest,{' '}
                    {matchingRx?.dose || 'therapeutic serving'}). Logged to crew health record.
                  </p>
                  <button
                    type="button"
                    onClick={dispense}
                    className="w-full max-w-md cursor-pointer rounded-md bg-[#E14D2A] px-6 py-4 font-mono text-sm font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#c94120] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E14D2A]"
                  >
                    EXTRACT SEED POD [{podCode}]
                  </button>
                </>
              )}
            </div>
          )}

          {phase === 'dispensing' && (
            <div className="flex flex-col gap-3 py-3" role="status" aria-live="polite">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-semibold text-[#0F172A]">{stageText}</span>
                <span className="font-bold text-[#E14D2A] tabular-nums">
                  {Math.round(progress)}%
                </span>
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
                    {selectedPod.rxTag} · Insert into NASA Veggie tray, inject water · Harvest in{' '}
                    {matchingRx?.harvestDays ?? '—'} days
                  </p>
                </div>
              </div>

              {remainingCount > 0 && (
                <button
                  type="button"
                  onClick={selectNextAvailable}
                  className="cursor-pointer rounded-md border border-slate-300 bg-white px-3.5 py-2 font-mono text-xs font-semibold text-[#0F172A] transition-colors hover:border-[#E14D2A] hover:text-[#E14D2A] focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
                >
                  Select Another Seed Pod →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
