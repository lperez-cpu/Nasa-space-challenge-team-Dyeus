import { useEffect, useMemo, useState } from 'react';
import { Trash2, UserPlus, Users } from 'lucide-react';
import BiometricsPanel from './components/BiometricsPanel';
import NewProfileModal from './components/NewProfileModal';
import SolutionPanel from './components/SolutionPanel';
import { useSolutionData, logDispense } from './data/api';
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
  const { data: solutionData, biometrics, refresh } = useSolutionData();
  const [profiles, setProfiles] = useState(loadStoredProfiles);
  const [activeProfileId, setActiveProfileId] = useState(
    () => localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY) || astronautProfile.id,
  );
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

          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-cyan-300/90">
            <div className="flex items-center gap-1.5 rounded border border-slate-700 bg-[#0B111E] px-2 py-1">
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              <select
                aria-label="Seleccionar perfil de astronauta"
                value={activeProfile.id}
                onChange={(e) => setActiveProfileId(e.target.value)}
                className="cursor-pointer bg-transparent font-mono text-[11px] text-slate-100 focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0B111E] text-slate-100">
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
              {activeProfile.isCustom && profiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(activeProfile.id)}
                  title="Eliminar perfil personalizado"
                  aria-label={`Eliminar perfil ${activeProfile.name}`}
                  className="ml-1 cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded border border-cyan-400/50 bg-cyan-500/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-cyan-500/25 hover:text-white"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Nuevo Perfil</span>
            </button>

            <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1">
              TELEMETRY: LIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Mission Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BiometricsPanel
            profile={activeProfile}
            mission={biometrics.mission}
            alerts={biometrics.alerts}
            onRescan={refresh}
          />
          <SolutionPanel data={syncedSolutionData} onDispensed={logDispense} />
        </div>
      </main>

      <NewProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onCreate={handleCreateProfile}
        existingIds={profiles.map((p) => p.id)}
      />
    </div>
  );
}
