import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MISSION_ROLES, useAuth } from '../../context/AuthContext';

const ROLE_HINT_EMAIL = {
  paciente: 'astronaut@eden.space',
  doctor: 'doctor@eden.space',
  programador: 'engineer@eden.space',
  admin: 'admin@eden.space',
};

export default function LoginGateView() {
  const { hasBackendAuth, signIn, submitAccessRequest } = useAuth();

  const [tab, setTab] = useState('login'); // 'login' | 'request'
  const [selectedRoleHint, setSelectedRoleHint] = useState('paciente');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Request Access form
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqRole, setReqRole] = useState('paciente');
  const [reqReason, setReqReason] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err?.message || 'Invalid credentials. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequest(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitAccessRequest({
        full_name: reqName.trim(),
        email: reqEmail.trim(),
        role_requested: reqRole,
        reason: reqReason.trim(),
      });
      setReqSuccess(true);
      setReqName('');
      setReqEmail('');
      setReqReason('');
    } catch (err) {
      setError(err?.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FBFBF8] px-4 py-8 text-[#0F172A]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <p className="font-mono text-2xl font-bold tracking-widest text-[#0F172A]">E.D.E.N.</p>
          <p className="mt-1 font-mono text-xs text-slate-600">
            Ecosystem Diagnostic &amp; Emergency Nutrition
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex gap-1 rounded-xl bg-[#DBE3E9] p-1">
          {['login', 'request'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
                setReqSuccess(false);
              }}
              className={`flex-1 cursor-pointer rounded-lg py-2 text-xs font-semibold transition-all ${
                tab === t
                  ? 'border border-[#0284C7]/30 bg-white text-[#0284C7] shadow-xs'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Request Access'}
            </button>
          ))}
        </div>

        {!hasBackendAuth && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 font-mono text-[11px] text-amber-900">
            Backend Auth (`signInWithPassword`) pending sync in `src/data/api.js`.
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Access Profile Reference Grid */}
            <div>
              <p className="mb-2 font-mono text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
                Access Profile
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MISSION_ROLES.map((r) => {
                  const active = selectedRoleHint === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoleHint(r.id)}
                      className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                        active
                          ? 'border-[#0284C7]/50 bg-[#6AA6DA]/15'
                          : 'border-slate-200 bg-white hover:bg-[#DBE3E9]/40'
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold ${
                          active ? 'text-[#0369A1]' : 'text-[#0F172A]'
                        }`}
                      >
                        {r.label}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] leading-tight text-slate-600">
                        {r.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-slate-500">
                Role permissions are verified from your Supabase credentials upon sign in.
              </p>
            </div>

            {/* Credentials */}
            <div>
              <label
                htmlFor="gate-email"
                className="mb-1.5 block font-mono text-[10px] font-semibold tracking-wider text-slate-600 uppercase"
              >
                Email
              </label>
              <input
                id="gate-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ROLE_HINT_EMAIL[selectedRoleHint] || 'user@eden.space'}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/25 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="gate-password"
                className="mb-1.5 block font-mono text-[10px] font-semibold tracking-wider text-slate-600 uppercase"
              >
                Password
              </label>
              <input
                id="gate-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/25 focus:outline-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-mono text-xs text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !hasBackendAuth}
              className="w-full cursor-pointer rounded-xl bg-[#0284C7] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        ) : reqSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="text-sm font-semibold text-emerald-900">Request submitted</p>
            <p className="mt-1 font-mono text-xs text-emerald-800">
              The administrator will review your request and notify you by email.
            </p>
            <button
              type="button"
              onClick={() => {
                setReqSuccess(false);
                setTab('login');
              }}
              className="mt-4 cursor-pointer font-mono text-xs font-semibold text-[#0284C7] hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label
                htmlFor="gate-req-name"
                className="mb-1.5 block font-mono text-[10px] font-semibold tracking-wider text-slate-600 uppercase"
              >
                Full Name
              </label>
              <input
                id="gate-req-name"
                type="text"
                required
                value={reqName}
                onChange={(e) => setReqName(e.target.value)}
                placeholder="Alex Commander"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/25 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="gate-req-email"
                className="mb-1.5 block font-mono text-[10px] font-semibold tracking-wider text-slate-600 uppercase"
              >
                Email
              </label>
              <input
                id="gate-req-email"
                type="email"
                required
                value={reqEmail}
                onChange={(e) => setReqEmail(e.target.value)}
                placeholder="user@eden.space"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/25 focus:outline-none"
              />
            </div>

            <div>
              <span className="mb-2 block font-mono text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
                Requested Role
              </span>
              <div className="grid grid-cols-2 gap-2">
                {MISSION_ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReqRole(r.id)}
                    className={`cursor-pointer rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${
                      reqRole === r.id
                        ? 'border-[#0284C7]/50 bg-[#6AA6DA]/15 text-[#0369A1]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-[#DBE3E9]/40'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="gate-req-reason"
                className="mb-1.5 block font-mono text-[10px] font-semibold tracking-wider text-slate-600 uppercase"
              >
                Reason
              </label>
              <textarea
                id="gate-req-reason"
                rows={2}
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                placeholder="Crew medical monitoring or bio-bay engineering..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/25 focus:outline-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-mono text-xs text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full cursor-pointer rounded-xl bg-[#0284C7] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0369A1] disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Access Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
