import BiometricsPanel from './components/BiometricsPanel';
import SolutionPanel from './components/SolutionPanel';
import { useSolutionData, logDispense } from './data/api';

export default function App() {
  const { data: solutionData } = useSolutionData();

  return (
    <div className="bg-telemetry-grid min-h-screen bg-[#05080F] text-slate-100">
      {/* Top Mission Control Header */}
      <header className="sticky top-0 z-30 border-b border-cyan-500/25 bg-[#070B14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
            <h1 className="font-mono text-xs font-bold tracking-[0.14em] text-slate-100 sm:text-sm">
              PROJECT E.D.E.N. | DEEP SPACE MODE — EARTH DELAY: 24m 12s (100% AUTONOMOUS)
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300/90">
            <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5">
              TELEMETRY: LIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Mission Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BiometricsPanel />
          <SolutionPanel data={solutionData} onDispensed={logDispense} />
        </div>
      </main>
    </div>
  );
}
