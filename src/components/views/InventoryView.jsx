import { Pill, CheckCircle2, Radiation, XCircle } from 'lucide-react';

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
      className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-[#0C1320] p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/35 bg-sky-400/10 text-sky-300">
            <Pill className="h-5 w-5" />
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
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#080D17] px-3 py-1.5 font-mono text-xs text-slate-300">
            <Radiation className="h-3.5 w-3.5 text-amber-400" />
            <span>
              CRUISE RATE: <strong className="text-slate-100">{radiation.rateMsvPerDay} mSv/d</strong>
            </span>
          </div>
        )}
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[#080D17] p-4">
          <p className="font-mono text-[11px] text-slate-500 uppercase">Total in Vault</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-100 tabular-nums">
            {seedVault.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="font-mono text-[11px] text-emerald-300/80 uppercase">DNA Authorized</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-300 tabular-nums">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
          <p className="font-mono text-[11px] text-red-300/80 uppercase">Discarded</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-300 tabular-nums">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Capsule Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {seedVault.map((c) => {
          const ok = c.status === 'approved';
          const dose = doseOf(c);

          return (
            <article
              key={c.id}
              className={`flex flex-col justify-between gap-4 rounded-xl border p-5 ${
                ok
                  ? 'border-emerald-500/40 bg-[#080D17]'
                  : 'border-red-500/40 bg-[#080D17]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{c.cartridge}</h3>
                    <p className="text-xs text-slate-400">{c.plant}</p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold ${
                      ok
                        ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                        : 'border-red-500/40 bg-red-950/40 text-red-300'
                    }`}
                  >
                    {ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {ok ? 'AUTHORIZED' : 'DISCARDED'}
                  </span>
                </div>

                {/* Viability Bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">GENOMIC VIABILITY</span>
                    <span
                      className={`font-bold tabular-nums ${
                        ok ? 'text-emerald-300' : 'text-red-300'
                      }`}
                    >
                      {c.viability}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        ok ? 'bg-emerald-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${c.viability}%` }}
                    />
                  </div>
                </div>

                <p className="mt-3 font-mono text-xs font-semibold text-slate-200">
                  {c.label}
                </p>
                <p className="mt-1 text-xs text-slate-400">{c.detail}</p>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-3.5">
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
                  <div className="mt-1 rounded-md border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-emerald-200">
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
