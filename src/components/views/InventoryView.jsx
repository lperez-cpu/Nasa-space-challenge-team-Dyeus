import { ShieldCheck, CheckCircle2, Radiation, XCircle } from 'lucide-react';
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
      aria-label="Seed Pod Vault and Genetic Audit"
      className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E14D2A]/10 text-[#E14D2A]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.16em] text-[#E14D2A] uppercase">
              Genetic Seed Vault Audit
            </p>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Seed Pod Vault &amp; Genetic Filter
            </h2>
          </div>
        </div>

        {radiation && (
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 font-mono text-xs font-medium text-slate-700">
            <Radiation className="h-3.5 w-3.5 text-amber-600" />
            <span>
              CRUISE RATE: <strong className="text-[#0F172A] tabular-nums">{radiation.rateMsvPerDay} mSv/d</strong>
            </span>
          </div>
        )}
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
          <p className="font-mono text-[11px] font-semibold text-slate-500 uppercase">Total in Vault</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
            {seedVault.length}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-mono text-[11px] font-semibold text-emerald-800 uppercase">Authorized</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-mono text-[11px] font-semibold text-red-800 uppercase">Discarded</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-700 tabular-nums">
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
                  ? 'border-emerald-200 bg-[#F8FAFC]'
                  : 'border-red-200 bg-red-50/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">{c.cartridge}</h3>
                    <p className="text-xs font-medium text-slate-500">{c.plant}</p>
                    <span
                      className={`mt-2 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                        ok
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-red-300 bg-red-50 text-red-800'
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
                      color={ok ? 'stroke-emerald-600' : 'stroke-red-600'}
                    />
                    <span className="font-mono text-[9px] font-semibold tracking-wider text-slate-500 uppercase">
                      VIABILITY · MODELED
                    </span>
                  </div>
                </div>

                <p className="mt-4 font-mono text-xs font-bold text-[#0F172A]">
                  {c.label}
                </p>
                <p className="mt-1 text-xs text-slate-600">{c.detail}</p>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 pt-3.5">
                {dose != null && (
                  <div className="flex items-baseline justify-between gap-2 font-mono text-xs">
                    <span className="text-slate-500">CUMULATIVE DOSE</span>
                    <span
                      className={`font-bold tabular-nums ${
                        ok ? 'text-[#0F172A]' : 'text-red-700'
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
                  <div className="mt-1 rounded border border-emerald-300 bg-white px-2.5 py-1.5 font-mono text-[11px] font-bold text-emerald-800">
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
