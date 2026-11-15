import { useEffect } from 'react';
import { Check, Trash2, UserPlus, Users, X } from 'lucide-react';

export default function ProfileSwitcherModal({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onDeleteProfile,
  onOpenNewProfile,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-switcher-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700/90 bg-[#0C1320] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/35 bg-sky-400/10 text-sky-300">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="profile-switcher-title"
                className="font-mono text-xs font-bold tracking-[0.16em] text-slate-100 uppercase"
              >
                Switch Profile
              </h2>
              <p className="font-mono text-[11px] text-slate-400">
                DEMO PROFILES · SHARED TELEMETRY LOG
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile switcher"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            return (
              <div
                key={profile.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                  isActive
                    ? 'border-sky-400/50 bg-sky-400/10'
                    : 'border-slate-800 bg-[#080D17] hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectProfile(profile.id);
                    onClose();
                  }}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-sky-400"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold ${
                      isActive
                        ? 'border-sky-400/50 bg-sky-400/20 text-sky-200'
                        : 'border-slate-800 bg-[#0C1320] text-slate-400'
                    }`}
                  >
                    {profile.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">
                        {profile.name}
                      </span>
                      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-sky-400" />}
                    </div>
                    <p className="truncate font-mono text-[11px] text-slate-400">
                      {profile.id} · {profile.role}
                    </p>
                  </div>
                </button>

                {profile.isCustom && profiles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteProfile(profile.id)}
                    title={`Delete profile ${profile.name}`}
                    aria-label={`Delete profile ${profile.name}`}
                    className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-950/50 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewProfile();
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[#04101A] uppercase transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
