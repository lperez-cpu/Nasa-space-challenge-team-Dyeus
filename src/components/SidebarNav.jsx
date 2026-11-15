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
    code: 'MOD-01',
    label: 'Astronaut Data',
    description: 'Profile, vitals & biometric scan',
    icon: UserRound,
  },
  {
    id: 'medical',
    code: 'MOD-02',
    label: 'Medical Consultation',
    description: 'Clinical alerts & botanical Rx',
    icon: Stethoscope,
  },
  {
    id: 'dispenser',
    code: 'MOD-03',
    label: 'Dispenser',
    description: 'Authorized cartridge release',
    icon: FlaskConical,
  },
  {
    id: 'inventory',
    code: 'MOD-04',
    label: 'Capsule Inventory',
    description: 'Genetic audit & radiation',
    icon: Pill,
  },
  {
    id: 'plants',
    code: 'MOD-05',
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        aria-label="Main window navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out md:sticky md:top-0 md:h-[100dvh] md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E14D2A] text-white">
              <HeartPulse className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.14em] text-[#0F172A]">
                PROJECT E.D.E.N.
              </p>
              <p className="font-mono text-[10px] font-medium tracking-wider text-slate-500">
                SWISS ORBITAL OS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close side menu"
            className="cursor-pointer rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[#E14D2A] md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Vertical Window Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3" aria-label="System windows">
          <p className="px-2 pb-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
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
                className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#E14D2A] ${
                  isActive
                    ? 'border-slate-200 border-l-3 border-l-[#E14D2A] bg-[#F8FAFC] text-[#0F172A]'
                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-[#0F172A]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border transition-colors ${
                    isActive
                      ? 'border-[#E14D2A]/30 bg-[#E14D2A]/10 text-[#E14D2A]'
                      : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold">
                      {item.label}
                    </span>
                    {showAlertBadge ? (
                      <span
                        title={`${alertsCount} active clinical alerts`}
                        className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded bg-red-600 px-1.5 font-mono text-[10px] font-bold text-white tabular-nums"
                      >
                        {alertsCount}
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] text-slate-400">
                        {item.code}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-slate-500">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Separated Profile Switcher Section (compact so never clipped) */}
        <div className="mt-auto border-t border-slate-200 bg-[#F8FAFC] p-3">
          <div className="mb-2.5 flex items-center gap-2.5 rounded-md border border-slate-200 bg-white px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-900 font-mono text-[11px] font-bold text-white">
              {activeProfile?.name?.slice(0, 2).toUpperCase() || 'AS'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#0F172A]">
                {activeProfile?.name}
              </p>
              <p className="truncate font-mono text-[10px] text-slate-500">
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
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold tracking-wide text-[#0F172A] transition-colors hover:border-[#E14D2A] hover:text-[#E14D2A] focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-[#E14D2A]" />
            <span>Switch Profile</span>
          </button>
        </div>
      </aside>
    </>
  );
}
