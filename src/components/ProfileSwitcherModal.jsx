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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E14D2A]/10 text-[#E14D2A]">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="profile-switcher-title"
                className="font-mono text-xs font-bold tracking-[0.16em] text-[#0F172A] uppercase"
              >
                Switch Profile
              </h2>
              <p className="font-mono text-[11px] text-slate-500">
                DEMO PROFILES · SHARED TELEMETRY LOG
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile switcher"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
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
                className={`flex items-center justify-between gap-3 rounded-md border p-3 transition-colors ${
                  isActive
                    ? 'border-[#E14D2A] bg-[#E14D2A]/5'
                    : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectProfile(profile.id);
                    onClose();
                  }}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${
                      isActive
                        ? 'bg-[#E14D2A] text-white'
                        : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {profile.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[#0F172A]">
                        {profile.name}
                      </span>
                      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-[#E14D2A]" />}
                    </div>
                    <p className="truncate font-mono text-[11px] text-slate-500">
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
                    className="cursor-pointer rounded-md p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewProfile();
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#E14D2A] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#c94120] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E14D2A]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
