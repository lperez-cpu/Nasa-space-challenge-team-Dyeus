import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  HeartPulse,
  Radio,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Waves,
} from 'lucide-react';
import { astronautProfile, missionData, vitalSigns } from '../data/mockData';

const SCAN_PHASES = [
  'CALIBRANDO BIOSENSORES SUBCUTÁNEOS...',
  'MUESTREANDO CORTISOL SÉRICO...',
  'EVALUANDO RESERVA VITAMÍNICA...',
  'SINCRONIZANDO TELEMETRÍA AUTÓNOMA...',
];

const STATUS_STYLES = {
  CRITICAL: 'border-red-500/80 bg-red-950/50 text-red-300',
  HIGH: 'border-red-500/70 bg-red-950/40 text-red-300',
  ELEVATED: 'border-amber-500/60 bg-amber-950/30 text-amber-300',
  NOMINAL: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
};

export default function BiometricsPanel({
  profile = astronautProfile,
  mission = missionData,
  vitals = vitalSigns,
  alerts,
  onRescan,
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhaseIdx, setScanPhaseIdx] = useState(0);
  const [scanCount, setScanCount] = useState(1);
  const [lastSync, setLastSync] = useState(profile.lastSync);

  useEffect(() => {
    setLastSync(profile.lastSync);
  }, [profile.id, profile.lastSync]);
  const timersRef = useRef([]);

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
        const phaseTimer = setTimeout(() => {
          setScanPhaseIdx(idx);
        }, idx * 600);
        timersRef.current.push(phaseTimer);
      }
    });

    const completeTimer = setTimeout(() => {
      const now = new Date();
      const utcTime = now.toISOString().slice(11, 19) + ' UTC';
      setLastSync(utcTime);
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

  const activeAlerts = Array.isArray(alerts) ? alerts : [vitals.cortisol, vitals.vitamins];

  return (
    <section
      aria-label="Panel Biométrico del Astronauta"
      className="relative flex flex-col gap-5 overflow-hidden rounded-xl border border-cyan-500/25 bg-[#0B111E]/95 p-5 shadow-[0_0_40px_rgba(6,182,212,0.08)]"
    >
      {/* Scan sweep overlay */}
      {isScanning && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        >
          <div className="animate-scan-sweep absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_24px_4px_rgba(34,211,238,0.8)]" />
          <div className="absolute inset-0 bg-cyan-500/5" />
        </div>
      )}

      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-mono text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
              Módulo Telemetría Biométrica
            </h2>
            <p className="font-mono text-[11px] text-slate-400">
              {mission.missionId} • {mission.missionDay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-300">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span>{profile.suitLink}</span>
        </div>
      </div>

      {/* Astronaut Profile Card */}
      <div className="rounded-lg border border-slate-800 bg-[#070B14] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-950/50 text-cyan-300">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  {profile.name}
                </h3>
                <span className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
                  {profile.id}
                </span>
              </div>
              <p className="text-xs font-medium text-cyan-300/90">
                {profile.role}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                {profile.vessel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-right font-mono text-[11px]">
            <div>
              <span className="text-slate-500">GRUPO: </span>
              <span className="font-semibold text-slate-200">{profile.bloodType}</span>
            </div>
            <div>
              <span className="text-slate-500">EVA: </span>
              <span className="font-semibold text-slate-200">{profile.evaHours}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">ÚLT. SYNC: </span>
              <span className="font-semibold text-cyan-300 tabular-nums">{lastSync}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Blinking Red Alerts */}
      <div className="flex flex-col gap-3" role="alert" aria-live="polite">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-red-400 uppercase">
            Alertas Clínicas Activas ({activeAlerts.length})
          </span>
          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
            CICLO #{String(scanCount).padStart(3, '0')}
          </span>
        </div>

        {activeAlerts.map((alertItem, idx) => {
          const Icon = idx % 2 === 0 ? AlertTriangle : ShieldAlert;
          return (
            <div
              key={alertItem.id || idx}
              className="animate-alert-beacon flex items-start justify-between gap-4 rounded-lg border-2 border-red-500/80 bg-red-950/55 p-3.5"
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider text-red-200 uppercase">
                      {alertItem.alertTitle}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-white ${
                        alertItem.status === 'CRITICAL' ? 'bg-red-600' : 'bg-red-500'
                      }`}
                    >
                      {alertItem.status}
                    </span>
                  </div>
                  {alertItem.alertDetail && (
                    <p className="mt-1 text-xs text-red-200/85">
                      {alertItem.alertDetail}
                    </p>
                  )}
                  {alertItem.referenceRange && (
                    <p className="mt-1 font-mono text-[11px] text-red-300/75">
                      REF: {alertItem.referenceRange}
                    </p>
                  )}
                </div>
              </div>
              {alertItem.value && (
                <div className="shrink-0 text-right">
                  <span className="font-mono text-xl font-bold text-red-300 tabular-nums">
                    {alertItem.value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Secondary Vitals Grid */}
      <div className="grid grid-cols-2 gap-3">
        {secondaryVitals.map((vital) => (
          <div
            key={vital.id}
            className="rounded-lg border border-slate-800 bg-[#070B14] p-3 transition-colors hover:border-slate-700"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <HeartPulse className="h-3.5 w-3.5 text-cyan-400/80" />
                {vital.label}
              </span>
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                  STATUS_STYLES[vital.status] || STATUS_STYLES.NOMINAL
                }`}
              >
                {vital.status}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-lg font-bold text-slate-100 tabular-nums">
                {vital.value}
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                {vital.referenceRange}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Re-scan Action */}
      <div className="mt-auto pt-1">
        {isScanning && (
          <div className="mb-2.5 flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-950/40 px-3 py-2 font-mono text-xs text-cyan-300">
            <Waves className="h-4 w-4 animate-pulse text-cyan-400" />
            <span>{SCAN_PHASES[scanPhaseIdx]}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleRescan}
          disabled={isScanning}
          className="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-cyan-400/60 bg-cyan-500/15 px-4 py-3 font-mono text-sm font-bold tracking-wider text-cyan-200 uppercase shadow-[0_0_20px_rgba(34,211,238,0.18)] transition-all hover:border-cyan-300 hover:bg-cyan-500/25 hover:text-white active:scale-[0.99] disabled:cursor-wait disabled:opacity-75"
        >
          <RefreshCw
            className={`h-4 w-4 text-cyan-300 transition-transform ${
              isScanning ? 'animate-spin' : 'group-hover:rotate-90'
            }`}
          />
          <span>
            {isScanning ? 'Escaneando Biométricos...' : 'Re-escanear Biométricos'}
          </span>
        </button>
      </div>
    </section>
  );
}
