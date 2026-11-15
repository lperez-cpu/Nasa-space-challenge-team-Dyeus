import { Pill, CheckCircle2, Radiation, XCircle } from 'lucide-react';
import RadialGauge from '../RadialGauge';

export default function InventoryView({ seedVault = [], radiation }) {
  const approvedCount = seedVault.filter((c) => c.status === 'approved').length;
  const rejectedCount = seedVault.filter((c) => c.status !== 'approved').length;

  const doseOf = (c) =>
    radiation && c.exposureDays != null
      ? Math.round(c.exposureDays * radiation.rateMsvPerDay * (c.shielding ?? 1))
      : null;

  return (
    <section
      aria-label="Capsule Inventory and Genetic Audit"
      className="flex flex-col gap-6 rounded-lg border border-[#1C2433] bg-[#0B0F17] p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1C2433] pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-sky-400/35 bg-sky-400/10 text-sky-300">
            <Pill className="h-4 w-4" />
          </span>
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-sky-300 uppercase">
              Genetic Seed Vault Audit
            </p>
            <h2 className="text-lg font-bold text-slate-100">
              Capsule Inventory & Genetic Filter
            </h2>
          </div>
        </div>

        {radiation && (
          <div className="flex items-center gap-2 rounded-md border border-[#1C2433] bg-[#070A10] px-3 py-1.5 font-mono text-xs text-slate-300">
            <Radiation className="h-3.5 w-3.5 text-amber-400" />
            <span>
              CRUISE RATE: <strong className="text-slate-100 tabular-nums">{radiation.rateMsvPerDay} mSv/d</strong>
            </span>
          </div>
        )}
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-lg border border-[#1C2433] bg-[#070A10] p-4">
          <p className="font-mono text-[11px] text-slate-500 uppercase">Total in Vault</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-100 tabular-nums">
            {seedVault.length}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="font-mono text-[11px] text-emerald-300/80 uppercase">DNA Authorized</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-300 tabular-nums">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4">
          <p className="font-mono text-[11px] text-red-300/80 uppercase">Discarded</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-300 tabular-nums">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Capsule Cards with Radial Viability Gauges */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {seedVault.map((c) => {
          const ok = c.status === 'approved';
          const dose = doseOf(c);

          return (
            <article
              key={c.id}
              className={`flex flex-col justify-between gap-4 rounded-lg border p-5 ${
                ok
                  ? 'border-emerald-500/35 bg-[#070A10]'
                  : 'border-red-500/35 bg-[#070A10]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{c.cartridge}</h3>
                    <p className="text-xs text-slate-400">{c.plant}</p>
                    <span
                      className={`mt-2 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                        ok
                          ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                          : 'border-red-500/40 bg-red-950/40 text-red-300'
                      }`}
                    >
                      {ok ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {ok ? 'AUTHORIZED' : 'DISCARDED'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <RadialGauge
                      value={c.viability}
                      size={60}
                      strokeWidth={5}
                      color={ok ? 'stroke-emerald-400' : 'stroke-red-500'}
                    />
                    <span className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">
                      VIABILITY
                    </span>
                  </div>
                </div>

                <p className="mt-4 font-mono text-xs font-semibold text-slate-200">
                  {c.label}
                </p>
                <p className="mt-1 text-xs text-slate-400">{c.detail}</p>
              </div>

              <div className="flex flex-col gap-2 border-t border-[#1C2433] pt-3.5">
                {dose != null && (
                  <div className="flex items-baseline justify-between gap-2 font-mono text-xs">
                    <span className="text-slate-500">CUMULATIVE DOSE</span>
                    <span
                      className={`font-bold tabular-nums ${
                        ok ? 'text-slate-200' : 'text-red-300'
                      }`}
                    >
                      {dose} mSv
                    </span>
                  </div>
                )}

                {c.exposureDays != null && radiation && (
                  <p className="font-mono text-[11px] text-slate-500">
                    {c.exposureDays} d × {radiation.rateMsvPerDay} mSv/d
                    {c.shielding !== 1 ? ` × shielding ${c.shielding}` : ' (unshielded)'}
                  </p>
                )}

                {ok && c.rxTag && (
                  <div className="mt-1 rounded border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-emerald-200">
                    {c.rxTag}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
