import { Droplets, Leaf, Sparkles, Sun, Thermometer } from 'lucide-react';
import RadialGauge from '../RadialGauge';

const CHAMBER_METRICS = [
  { label: 'Nutrient pH', value: '5.8', icon: Droplets, status: 'SIMULATED' },
  { label: 'Chamber Temp', value: '22.4 °C', icon: Thermometer, status: 'SIMULATED' },
  { label: 'PAR Spectrum', value: '340 µmol', icon: Sun, status: 'SIMULATED' },
];

export default function PlantStatusView({
  prescriptions = [],
  seedVault = [],
  dispenseHistory = [],
  localDispensed = [],
  dataSource = 'mock',
}) {
  const allDispenses = [...localDispensed, ...(dispenseHistory || [])];

  // Build active cultivation bays strictly from real/session dispense entries
  const activeCultures = allDispenses.map((entry, idx) => {
    const cart = seedVault.find((c) => c.id === entry.cartridge_id);
    const plantName = entry.plant || cart?.plant || '—';
    const plantInfo = prescriptions.find(
      (p) => p.plant?.toLowerCase() === plantName.toLowerCase(),
    );
    const totalDays = plantInfo?.harvestDays || 21;
    const msElapsed = entry.dispensed_at
      ? Math.max(0, Date.now() - new Date(entry.dispensed_at).getTime())
      : 0;
    const elapsedDays = entry.isLocal
      ? 1
      : Math.min(totalDays, Math.max(1, Math.floor(msElapsed / 86400000) + 1));
    const progressPct = Math.round((elapsedDays / totalDays) * 100);

    return {
      key: entry.id || `${entry.cartridge_id}-${idx}`,
      plant: plantName,
      latin: plantInfo?.latin || null,
      cartridge: cart?.cartridge || entry.cartridge_id || '—',
      stage:
        elapsedDays <= 2
          ? 'GERMINATION'
          : elapsedDays < totalDays
            ? 'VEGETATIVE GROWTH'
            : 'READY FOR HARVEST',
      elapsedDays,
      totalDays,
      progressPct,
      timestamp: entry.dispensed_at
        ? new Date(entry.dispensed_at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
        : 'JUST NOW',
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Hydroponic Bay & Active Cultures */}
      <section
        aria-label="Hydroponic Cultivation Bay"
        className="rounded-lg border border-[#1C2433] bg-[#0B0F17] p-6"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#1C2433] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-emerald-400/35 bg-emerald-400/10 text-emerald-300">
              <Leaf className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase">
                Hydroponic Bio-Bay
              </p>
              <h2 className="text-lg font-bold text-slate-100">
                Active Plant Status ({activeCultures.length})
              </h2>
            </div>
          </div>

          <span
            className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold ${
              dataSource === 'supabase'
                ? 'border-emerald-500/40 bg-emerald-950/35 text-emerald-300'
                : 'border-amber-500/40 bg-amber-950/30 text-amber-200'
            }`}
          >
            {dataSource === 'supabase' ? 'BACKEND: SUPABASE LIVE' : 'BACKEND: DEMO FALLBACK'}
          </span>
        </div>

        {/* Chamber Environment Telemetry */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CHAMBER_METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="flex items-center justify-between rounded-md border border-[#1C2433] bg-[#070A10] px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-sky-400" />
                  <div>
                    <p className="text-[11px] text-slate-400">{m.label}</p>
                    <p className="font-mono text-sm font-bold text-slate-100 tabular-nums">
                      {m.value}
                    </p>
                  </div>
                </div>
                <span className="rounded border border-amber-500/35 bg-amber-950/35 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-200">
                  {m.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Active Plant Progress Cards with Radial Rings */}
        {activeCultures.length === 0 ? (
          <div className="rounded-lg border border-[#1C2433] bg-[#070A10] p-5 text-sm text-slate-400">
            No cartridges currently in cultivation. Dispense an authorized cartridge from the{' '}
            <strong className="text-slate-200">Dispenser</strong> module to initiate a hydroponic cycle.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeCultures.map((item) => (
              <article
                key={item.key}
                className="flex flex-col justify-between gap-4 rounded-lg border border-[#1C2433] bg-[#070A10] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{item.plant}</h3>
                    {item.latin && (
                      <p className="text-xs italic text-slate-400">{item.latin}</p>
                    )}
                    <span className="mt-2 inline-block rounded border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                      {item.stage}
                    </span>
                    <p className="mt-2.5 font-mono text-xs text-slate-400 tabular-nums">
                      DAY {item.elapsedDays} OF {item.totalDays}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <RadialGauge
                      value={item.progressPct}
                      size={60}
                      strokeWidth={5}
                      color="stroke-emerald-400"
                    />
                    <span className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">
                      GROWTH
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#1C2433] pt-3 font-mono text-[11px] text-slate-400">
                  <span>UNIT: {item.cartridge}</span>
                  <span className="tabular-nums">{item.timestamp}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 2. Botanical Registry */}
      <section
        aria-label="Botanical Catalog from Backend"
        className="rounded-lg border border-[#1C2433] bg-[#0B0F17] p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#1C2433] pb-4">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-sky-300 uppercase">
              Supabase Botanical Registry
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-100">
              Available Species Catalog ({prescriptions.length})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {prescriptions.map((plant) => (
            <article
              key={plant.id}
              className="flex flex-col justify-between gap-3 rounded-lg border border-[#1C2433] bg-[#070A10] p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{plant.plant}</h3>
                    {plant.latin && (
                      <p className="text-xs italic text-slate-400">{plant.latin}</p>
                    )}
                  </div>
                  {plant.nasaBacked ? (
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/35 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      NASA BACKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded border border-amber-500/40 bg-amber-950/35 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-200">
                      NOT FLIGHT-VALIDATED
                    </span>
                  )}
                </div>

                {plant.effect && (
                  <p className="mt-2 text-xs text-slate-300">{plant.effect}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1C2433] pt-2.5 font-mono text-[11px]">
                <span className="text-amber-300/90">TARGET: {plant.condition || 'General'}</span>
                <span className="text-sky-300 tabular-nums">
                  {plant.harvestDays ?? '—'} DAYS GROW
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
