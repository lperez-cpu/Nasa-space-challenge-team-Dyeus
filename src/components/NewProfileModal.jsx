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
      setError('El nombre del tripulante es obligatorio.');
      return;
    }
    if (!role) {
      setError('El rol o especialidad es obligatorio.');
      return;
    }

    const candidateId = (form.id.trim() || generateProfileId(name, existingIds.length)).toUpperCase();
    if (existingIds.includes(candidateId)) {
      setError(`El ID "${candidateId}" ya existe. Usa otro identificador.`);
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
      <div className="w-full max-w-lg rounded-xl border border-cyan-500/40 bg-[#0B111E] p-5 shadow-[0_0_50px_rgba(6,182,212,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="new-profile-title"
                className="font-mono text-xs font-bold tracking-[0.18em] text-cyan-300 uppercase"
              >
                Registrar Nuevo Perfil
              </h2>
              <p className="font-mono text-[11px] text-slate-400">
                ALTA DE TRIPULANTE EN TELEMETRÍA E.D.E.N.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="cursor-pointer rounded-md border border-slate-700 bg-slate-800/70 p-1.5 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          {error && (
            <div className="rounded-md border border-red-500/60 bg-red-950/50 px-3 py-2 font-mono text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                Nombre Completo *
              </span>
              <input
                type="text"
                autoFocus
                placeholder="Ej. Dr. Marcus Chen"
                value={form.name}
                onChange={updateField('name')}
                className="rounded-lg border border-slate-700 bg-[#070B14] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                ID Tripulante
              </span>
              <input
                type="text"
                placeholder="Auto (ej. AST-05-CHEN)"
                value={form.id}
                onChange={updateField('id')}
                className="rounded-lg border border-slate-700 bg-[#070B14] px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                Grupo Sanguíneo
              </span>
              <select
                value={form.bloodType}
                onChange={updateField('bloodType')}
                className="rounded-lg border border-slate-700 bg-[#070B14] px-3 py-2 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                Rol / Especialidad *
              </span>
              <input
                type="text"
                placeholder="Ej. Botanical Systems Officer"
                value={form.role}
                onChange={updateField('role')}
                className="rounded-lg border border-slate-700 bg-[#070B14] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                Nave / Módulo
              </span>
              <input
                type="text"
                value={form.vessel}
                onChange={updateField('vessel')}
                className="rounded-lg border border-slate-700 bg-[#070B14] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                Horas EVA
              </span>
              <input
                type="text"
                placeholder="0.0 HRS"
                value={form.evaHours}
                onChange={updateField('evaHours')}
                className="rounded-lg border border-slate-700 bg-[#070B14] px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 font-mono text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-4 py-2 font-mono text-xs font-bold tracking-wider text-cyan-200 uppercase transition-all hover:border-cyan-300 hover:bg-cyan-500/30 hover:text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              Guardar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
