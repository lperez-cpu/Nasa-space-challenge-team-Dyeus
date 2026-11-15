import { useEffect, useRef, useState } from 'react';
import { Activity, HeartPulse, Radio, RefreshCw, UserCheck, Waves } from 'lucide-react';
import { astronautProfile, missionData, vitalSigns } from '../../data/mockData';

const SCAN_PHASES = [
  'CALIBRATING SUBCUTANEOUS BIOSENSORS...',
  'SAMPLING SERUM CORTISOL...',
  'EVALUATING VITAMIN RESERVES...',
  'SYNCHRONIZING AUTONOMOUS TELEMETRY...',
];

const STATUS_STYLES = {
  CRITICAL: 'border-red-200 bg-red-50 text-red-700',
  HIGH: 'border-red-200 bg-red-50 text-red-700',
  ELEVATED: 'border-amber-200 bg-amber-50 text-amber-800',
  NOMINAL: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const GAUGE_FILL = {
  CRITICAL: { width: '92%', bar: 'bg-red-600' },
  HIGH: { width: '85%', bar: 'bg-red-500' },
  ELEVATED: { width: '72%', bar: 'bg-amber-500' },
  NOMINAL: { width: '52%', bar: 'bg-emerald-600' },
};

export default function AstronautView({
  profile = astronautProfile,
  mission = missionData,
  vitals = vitalSigns,
  onRescan,
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhaseIdx, setScanPhaseIdx] = useState(0);
  const [scanCount, setScanCount] = useState(1);
  const [lastSync, setLastSync] = useState(profile.lastSync);
  const timersRef = useRef([]);

  useEffect(() => {
    setLastSync(profile.lastSync);
  }, [profile.id, profile.lastSync]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleRescan = () => {
    if (isScanning) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setIsScanning(true);
    setScanPhaseIdx(0);

    SCAN_PHASES.forEach((_, idx) => {
      if (idx > 0) {
        const phaseTimer = setTimeout(() => setScanPhaseIdx(idx), idx * 600);
        timersRef.current.push(phaseTimer);
      }
    });

    const completeTimer = setTimeout(() => {
      const now = new Date();
      setLastSync(now.toISOString().slice(11, 19) + ' UTC');
      setScanCount((prev) => prev + 1);
      setIsScanning(false);
      onRescan?.();
    }, SCAN_PHASES.length * 600);

    timersRef.current.push(completeTimer);
  };

  const secondaryVitals = [
    vitals.heartRate,
    vitals.spo2,
    vitals.radiationDose,
    vitals.circadianDrift,
  ];

  return (
    <section
      aria-label="Astronaut Data"
      className="relative flex flex-col gap-6 overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-xs"
    >
      {isScanning && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        >
          <div className="animate-scan-sweep absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E14D2A] to-transparent" />
          <div className="absolute inset-0 bg-[#E14D2A]/5" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E14D2A]/10 text-[#E14D2A]">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-mono text-xs font-bold tracking-[0.16em] text-[#E14D2A] uppercase">
              Crew Biometric Record
            </h2>
            <p className="font-mono text-xs text-slate-500">
              {mission.missionId} · {mission.missionDay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-800">
          <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
          <span>{profile.suitLink}</span>
        </div>
      </div>

      {/* Identity Card */}
      <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[#0F172A]">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                  {profile.name}
                </h3>
                <span className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                  {profile.id}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-[#0284C7]">{profile.role}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">{profile.vessel}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-2.5 font-mono text-xs sm:text-right">
            <div>
              <dt className="text-slate-500">BLOOD TYPE</dt>
              <dd className="mt-0.5 font-bold text-[#0F172A]">{profile.bloodType}</dd>
            </div>
            <div>
              <dt className="text-slate-500">EVA HOURS</dt>
              <dd className="mt-0.5 font-bold text-[#0F172A] tabular-nums">{profile.evaHours}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">LAST SYNC</dt>
              <dd className="mt-0.5 font-semibold text-[#0284C7] tabular-nums">
                {lastSync} · CYCLE #{String(scanCount).padStart(3, '0')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Secondary Vitals Grid with Nominal Range Bars */}
      <div>
        <h3 className="mb-3 font-mono text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
          Basal Vital Signs
        </h3>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {secondaryVitals.map((vital) => {
            const gauge = GAUGE_FILL[vital.status] || GAUGE_FILL.NOMINAL;
            return (
              <div
                key={vital.id}
                className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4 transition-colors hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <HeartPulse className="h-4 w-4 text-[#E14D2A]" />
                    {vital.label}
                  </span>
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                      STATUS_STYLES[vital.status] || STATUS_STYLES.NOMINAL
                    }`}
                  >
                    {vital.status}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
                    {vital.value}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    REF: {vital.referenceRange}
                  </span>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-slate-200" aria-hidden="true">
                  <div className={`h-full ${gauge.bar}`} style={{ width: gauge.width }} />
                </div>

                {vital.source && (
                  <p className="mt-2 font-mono text-[10px] text-slate-500">
                    Data source: {vital.source}
                    {vital.sourceSimulated ? ' · simulated feed' : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Re-scan Action */}
      <div className="border-t border-slate-200 pt-5">
        {isScanning && (
          <div className="mb-3 flex items-center gap-2.5 rounded-md border border-[#E14D2A]/30 bg-[#E14D2A]/10 px-3.5 py-2.5 font-mono text-xs font-medium text-[#0F172A]">
            <Waves className="h-4 w-4 animate-pulse text-[#E14D2A]" />
            <span>{SCAN_PHASES[scanPhaseIdx]}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleRescan}
          disabled={isScanning}
          className="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-md bg-[#E14D2A] px-5 py-3.5 font-mono text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#c94120] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E14D2A] disabled:cursor-wait disabled:opacity-75"
        >
          <RefreshCw
            className={`h-4 w-4 transition-transform ${
              isScanning ? 'animate-spin' : 'group-hover:rotate-90'
            }`}
          />
          <span>
            {isScanning ? 'Scanning Biometrics...' : 'Re-scan Biometrics'}
          </span>
        </button>
      </div>
    </section>
  );
}
