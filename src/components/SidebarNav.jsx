import {
  ArrowLeftRight,
  FlaskConical,
  HeartPulse,
  Leaf,
  Pill,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';

export const NAV_WINDOWS = [
  {
    id: 'astronaut',
    label: 'Astronaut Data',
    description: 'Profile, vitals & biometric scan',
    icon: UserRound,
  },
  {
    id: 'medical',
    label: 'Medical Consultation',
    description: 'Clinical alerts & botanical Rx',
    icon: Stethoscope,
  },
  {
    id: 'dispenser',
    label: 'Dispenser',
    description: 'Authorized cartridge release',
    icon: FlaskConical,
  },
  {
    id: 'inventory',
    label: 'Capsule Inventory',
    description: 'Genetic audit & radiation',
    icon: Pill,
  },
  {
    id: 'plants',
    label: 'Plant Status',
    description: 'Hydroponic growth & bio-bay',
    icon: Leaf,
  },
];

export default function SidebarNav({
  activeView,
  onSelectView,
  activeProfile,
  alertsCount = 0,
  onOpenProfileSwitcher,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const handleNavClick = (viewId) => {
    onSelectView(viewId);
    onCloseMobile?.();
  };

  return (
    <>
      {isMobileOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        aria-label="Main window navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col border-r border-slate-800/90 bg-[#080D17] transition-transform duration-200 ease-out md:sticky md:top-0 md:h-[100dvh] md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800/90 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/35 bg-sky-400/10 text-sky-300">
              <HeartPulse className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.16em] text-slate-100">
                PROJECT E.D.E.N.
              </p>
              <p className="font-mono text-[10px] tracking-wider text-sky-400/85">
                BIO-SYNC OS · AUTONOMOUS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close side menu"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-sky-400 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Vertical Window Navigation */}
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-5" aria-label="System windows">
          <p className="px-3 pb-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Control Modules
          </p>

          {NAV_WINDOWS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const showAlertBadge = item.id === 'medical' && alertsCount > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  isActive
                    ? 'border-sky-400/40 bg-sky-400/12 text-slate-100'
                    : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-[#0F1726] hover:text-slate-200'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    isActive
                      ? 'border-sky-400/40 bg-sky-400/15 text-sky-300'
                      : 'border-slate-800 bg-[#0B111D] text-slate-400 group-hover:border-slate-700 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {item.label}
                    </span>
                    {showAlertBadge && (
                      <span
                        title={`${alertsCount} active clinical alerts`}
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 font-mono text-[10px] font-bold text-red-300 tabular-nums"
                      >
                        {alertsCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Separated Profile Switcher Section */}
        <div className="mt-auto border-t border-slate-800/90 bg-[#060A12] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-800/80 bg-[#0C1320] px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10 font-mono text-xs font-bold text-sky-300">
              {activeProfile?.name?.slice(0, 2).toUpperCase() || 'AS'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-100">
                {activeProfile?.name}
              </p>
              <p className="truncate font-mono text-[10px] text-slate-400">
                {activeProfile?.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onCloseMobile?.();
              onOpenProfileSwitcher();
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#121B2D] px-3.5 py-2.5 font-mono text-xs font-semibold tracking-wide text-slate-100 transition-colors hover:border-sky-400/60 hover:bg-sky-400/15 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-sky-400" />
            <span>Switch Profile</span>
          </button>
        </div>
      </aside>
    </>
  );
}
