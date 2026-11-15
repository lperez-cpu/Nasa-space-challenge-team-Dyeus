import { useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import NewProfileModal from './components/NewProfileModal';
import ProfileSwitcherModal from './components/ProfileSwitcherModal';
import SidebarNav, { NAV_WINDOWS } from './components/SidebarNav';
import AstronautView from './components/views/AstronautView';
import DispenserView from './components/views/DispenserView';
import InventoryView from './components/views/InventoryView';
import MedicalView from './components/views/MedicalView';
import PlantStatusView from './components/views/PlantStatusView';
import { logDispense, useSolutionData } from './data/api';
import { astronautProfile } from './data/mockData';

const PROFILES_STORAGE_KEY = 'eden_crew_profiles';
const ACTIVE_PROFILE_STORAGE_KEY = 'eden_active_profile_id';

function loadStoredProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return [astronautProfile];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [astronautProfile];
  } catch {
    return [astronautProfile];
  }
}

export default function App() {
  const { data: solutionData, biometrics, source, loading, refresh } = useSolutionData();
  const [profiles, setProfiles] = useState(loadStoredProfiles);
  const [activeProfileId, setActiveProfileId] = useState(
    () => localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY) || astronautProfile.id,
  );

  const [activeView, setActiveView] = useState('astronaut');
  const [localDispensed, setLocalDispensed] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // Ignore storage quota errors
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, activeProfileId);
    } catch {
      // Ignore storage quota errors
    }
  }, [activeProfileId]);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || profiles[0] || astronautProfile,
    [profiles, activeProfileId],
  );

  const syncedSolutionData = useMemo(
    () => ({
      ...solutionData,
      crew: {
        ...solutionData.crew,
        id: activeProfile.id,
        name: activeProfile.name,
        module: activeProfile.vessel?.split('//')[1]?.trim() || solutionData.crew.module,
      },
    }),
    [solutionData, activeProfile],
  );

  const handleCreateProfile = (newProfile) => {
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  const handleDeleteProfile = (idToDelete) => {
    setProfiles((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((p) => p.id !== idToDelete);
      if (activeProfile.id === idToDelete && next[0]) {
        setActiveProfileId(next[0].id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (source === 'supabase' && (solutionData.dispenseHistory?.length ?? 0) > 0) {
      setLocalDispensed([]);
    }
  }, [source, solutionData.dispenseHistory]);

  const handleDispensed = async (cartridge) => {
    if (!cartridge) return;
    if (source !== 'supabase') {
      setLocalDispensed((prev) => [
        {
          id: `local-${Date.now()}`,
          cartridge_id: cartridge.id,
          plant: cartridge.plant,
          dispensed_at: new Date().toISOString(),
          isLocal: true,
        },
        ...prev,
      ]);
    }
    await logDispense(cartridge);
    refresh();
  };

  const currentWindowMeta =
    NAV_WINDOWS.find((w) => w.id === activeView) || NAV_WINDOWS[0];
  const alertsCount = Array.isArray(biometrics.alerts) ? biometrics.alerts.length : 0;

  return (
    <div className="bg-telemetry-grid flex min-h-[100dvh] bg-[#060911] text-slate-100">
      {/* Left Vertical Sidebar */}
      <SidebarNav
        activeView={activeView}
        onSelectView={setActiveView}
        activeProfile={activeProfile}
        alertsCount={alertsCount}
        onOpenProfileSwitcher={() => setIsSwitcherOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Active Window Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#060911]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open side menu"
                className="cursor-pointer rounded-lg border border-slate-800 bg-[#0C1320] p-2 text-slate-200 transition-colors hover:border-sky-400/50 focus-visible:outline-2 focus-visible:outline-sky-400 md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-100 sm:text-lg">
                  {currentWindowMeta.label}
                </h1>
                <p className="text-xs text-slate-400">{currentWindowMeta.description}</p>
              </div>
            </div>

            <div className="hidden items-center gap-2.5 font-mono text-[11px] sm:flex">
              <span className="rounded-md border border-slate-800 bg-[#0C1320] px-2.5 py-1 text-slate-300">
                DELAY: {biometrics.mission?.earthDelay || '12m 05s'}
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-semibold ${
                  source === 'supabase'
                    ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300'
                    : 'border-sky-400/30 bg-sky-400/10 text-sky-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    loading
                      ? 'animate-pulse bg-amber-400'
                      : source === 'supabase'
                        ? 'bg-emerald-400'
                        : 'bg-sky-400'
                  }`}
                />
                {loading
                  ? 'SYNCING...'
                  : source === 'supabase'
                    ? 'BACKEND: SUPABASE'
                    : 'TELEMETRY: DEMO'}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {activeView === 'astronaut' && (
            <AstronautView
              profile={activeProfile}
              mission={biometrics.mission}
              vitals={biometrics.vitals}
              onRescan={refresh}
            />
          )}

          {activeView === 'medical' && (
            <MedicalView
              alerts={biometrics.alerts}
              prescriptions={syncedSolutionData.prescriptions}
              onGoToDispenser={() => setActiveView('dispenser')}
            />
          )}

          {activeView === 'dispenser' && (
            <DispenserView
              crew={syncedSolutionData.crew}
              prescriptions={syncedSolutionData.prescriptions}
              seedVault={syncedSolutionData.seedVault}
              onDispensed={handleDispensed}
            />
          )}

          {activeView === 'inventory' && (
            <InventoryView
              seedVault={syncedSolutionData.seedVault}
              radiation={syncedSolutionData.radiation}
            />
          )}

          {activeView === 'plants' && (
            <PlantStatusView
              prescriptions={syncedSolutionData.prescriptions}
              seedVault={syncedSolutionData.seedVault}
              dispenseHistory={syncedSolutionData.dispenseHistory}
              localDispensed={localDispensed}
              dataSource={source}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ProfileSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfile.id}
        onSelectProfile={setActiveProfileId}
        onDeleteProfile={handleDeleteProfile}
        onOpenNewProfile={() => setIsProfileModalOpen(true)}
      />

      <NewProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onCreate={handleCreateProfile}
        existingIds={profiles.map((p) => p.id)}
      />
    </div>
  );
}
