import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, X } from 'lucide-react';

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const INITIAL_FORM = {
  name: '',
  id: '',
  role: '',
  vessel: 'USCSS Odysseus // Hab-Module B',
  bloodType: 'O+',
  evaHours: '0.0 HRS',
  suitLink: 'BIOSENSOR-LINK ACTIVE',
};

function generateProfileId(name, existingCount) {
  const num = String(existingCount + 4).padStart(2, '0');
  const lastWord = name
    .trim()
    .split(/\s+/)
    .pop()
    ?.replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  return `AST-${num}-${lastWord || 'CREW'}`;
}

function formatEvaHours(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '0.0 HRS';
  return /hrs$/i.test(trimmed) ? trimmed.toUpperCase() : `${trimmed} HRS`;
}

export default function NewProfileModal({ isOpen, onClose, onCreate, existingIds = [] }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setError('');

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const role = form.role.trim();

    if (!name) {
      setError('Crew member name is required.');
      return;
    }
    if (!role) {
      setError('Role or specialty is required.');
      return;
    }

    const candidateId = (form.id.trim() || generateProfileId(name, existingIds.length)).toUpperCase();
    if (existingIds.includes(candidateId)) {
      setError(`ID "${candidateId}" already exists. Choose another identifier.`);
      return;
    }

    const nowUtc = new Date().toISOString().slice(11, 19) + ' UTC';
    onCreate({
      id: candidateId,
      name,
      role,
      vessel: form.vessel.trim() || 'USCSS Odysseus // Hab-Module B',
      suitLink: form.suitLink.trim() || 'BIOSENSOR-LINK ACTIVE',
      bloodType: form.bloodType,
      evaHours: formatEvaHours(form.evaHours),
      lastSync: nowUtc,
      isCustom: true,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/90 bg-[#0C1320] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/35 bg-sky-400/10 text-sky-300">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="new-profile-title"
                className="font-mono text-xs font-bold tracking-[0.18em] text-sky-300 uppercase"
              >
                Register New Profile
              </h2>
              <p className="font-mono text-[11px] text-slate-400">
                CREW ONBOARDING · E.D.E.N. TELEMETRY
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-300">
                FULL NAME *
              </span>
              <input
                type="text"
                value={form.name}
                onChange={updateField('name')}
                placeholder="e.g., Dr. Marcus Chen"
                autoFocus
                className="rounded-lg border border-slate-700 bg-[#080D17] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-300">
                CREW ID (OPTIONAL)
              </span>
              <input
                type="text"
                value={form.id}
                onChange={updateField('id')}
                placeholder="Auto: AST-05-CHEN"
                className="rounded-lg border border-slate-700 bg-[#080D17] px-3 py-2 font-mono text-sm text-slate-100 uppercase placeholder:normal-case placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-mono text-[11px] font-semibold text-slate-300">
              ROLE / SPECIALTY *
            </span>
            <input
              type="text"
              value={form.role}
              onChange={updateField('role')}
              placeholder="e.g., Astrobiologist & Payload Specialist"
              className="rounded-lg border border-slate-700 bg-[#080D17] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-mono text-[11px] font-semibold text-slate-300">
              VESSEL / MODULE
            </span>
            <input
              type="text"
              value={form.vessel}
              onChange={updateField('vessel')}
              className="rounded-lg border border-slate-700 bg-[#080D17] px-3 py-2 font-mono text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-300">
                BLOOD TYPE
              </span>
              <select
                value={form.bloodType}
                onChange={updateField('bloodType')}
                className="rounded-lg border border-slate-700 bg-[#080D17] px-3 py-2 font-mono text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
              >
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-300">
                EVA HOURS
              </span>
              <input
                type="text"
                value={form.evaHours}
                onChange={updateField('evaHours')}
                placeholder="48.0 HRS"
                className="rounded-lg border border-slate-700 bg-[#080D17] px-3 py-2 font-mono text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-300">
                SUIT LINK
              </span>
              <input
                type="text"
                value={form.suitLink}
                onChange={updateField('suitLink')}
                className="rounded-lg border border-slate-700 bg-[#080D17] px-3 py-2 font-mono text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 font-mono text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 font-mono text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 font-mono text-xs font-bold tracking-wider text-[#04101A] uppercase transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
