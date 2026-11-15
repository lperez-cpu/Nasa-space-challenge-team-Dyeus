import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, UserPlus, X } from 'lucide-react';

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const INITIAL_FORM = {
  name: '',
  id: '',
  role: '',
  vessel: 'ISS / Deep Space Habitat // Veggie Bio-Bay',
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

  // El formulario se limpia SOLO al abrir el modal. Antes dependía también de `onClose`, que App
  // recrea en cada render (la app se refresca cada 15 s): eso borraba lo que el usuario escribía.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setError('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

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
      vessel: form.vessel.trim() || 'ISS / Deep Space Habitat // Veggie Bio-Bay',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E14D2A]/10 text-[#E14D2A]">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="new-profile-title"
                className="font-mono text-xs font-bold tracking-[0.18em] text-[#0F172A] uppercase"
              >
                Register New Profile
              </h2>
              <p className="font-mono text-[11px] text-slate-500">
                CREW ONBOARDING · E.D.E.N. TELEMETRY
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-600">
                FULL NAME *
              </span>
              <input
                type="text"
                value={form.name}
                onChange={updateField('name')}
                placeholder="e.g., Dr. Marcus Chen"
                autoFocus
                className="rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#E14D2A] focus:bg-white focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-600">
                CREW ID (OPTIONAL)
              </span>
              <input
                type="text"
                value={form.id}
                onChange={updateField('id')}
                placeholder="Auto: AST-05-CHEN"
                className="rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#0F172A] uppercase placeholder:normal-case placeholder:text-slate-400 focus:border-[#E14D2A] focus:bg-white focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-mono text-[11px] font-semibold text-slate-600">
              ROLE / SPECIALTY *
            </span>
            <input
              type="text"
              value={form.role}
              onChange={updateField('role')}
              placeholder="e.g., Astrobiologist & Payload Specialist"
              className="rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#E14D2A] focus:bg-white focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-mono text-[11px] font-semibold text-slate-600">
              VESSEL / MODULE
            </span>
            <input
              type="text"
              value={form.vessel}
              onChange={updateField('vessel')}
              className="rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 font-mono text-xs text-[#0F172A] focus:border-[#E14D2A] focus:bg-white focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-600">
                BLOOD TYPE
              </span>
              <select
                value={form.bloodType}
                onChange={updateField('bloodType')}
                className="rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#0F172A] focus:border-[#E14D2A] focus:bg-white focus:outline-none"
              >
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-600">
                EVA HOURS
              </span>
              <input
                type="text"
                value={form.evaHours}
                onChange={updateField('evaHours')}
                placeholder="48.0 HRS"
                className="rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#0F172A] focus:border-[#E14D2A] focus:bg-white focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-600">
                SUIT LINK
              </span>
              <input
                type="text"
                value={form.suitLink}
                onChange={updateField('suitLink')}
                className="rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 font-mono text-xs text-[#0F172A] focus:border-[#E14D2A] focus:bg-white focus:outline-none"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 font-mono text-xs text-red-800">
              {error}
            </p>
          )}

          <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 font-mono text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#E14D2A] px-4 py-2 font-mono text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#C73F1E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E14D2A]"
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
