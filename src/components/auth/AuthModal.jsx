import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Shield, UserPlus, X } from 'lucide-react';
import { MISSION_ROLES, useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const {
    activeRole,
    displayName,
    isAuthenticated,
    hasBackendAuth,
    signIn,
    signOut,
    switchDemoRole,
    submitAccessRequest,
  } = useAuth();

  const [tab, setTab] = useState('login'); // 'login' | 'request'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Request Access form
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqRole, setReqRole] = useState('doctor');
  const [reqReason, setReqReason] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      setEmail('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Verify your credentials.');
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
      setError(err?.message || 'Unable to submit access request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-[#F8FAFC] px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-widest text-[#E14D2A] uppercase">
              PROJECT E.D.E.N. // ACCESS CONTROL
            </p>
            <h2 id="auth-modal-title" className="mt-0.5 text-base font-bold text-[#0F172A]">
              Sign In &amp; Mission Role
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close access modal"
            className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:border-[#E14D2A] hover:text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#E14D2A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Current Session Banner */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#F4F6F9] px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                {isAuthenticated ? 'AUTHENTICATED SESSION' : 'ACTIVE DEMO MODE'}
              </p>
              <p className="truncate text-xs font-bold text-[#0F172A]">{displayName}</p>
            </div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={signOut}
                className="shrink-0 cursor-pointer rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-[#F4F6F9] p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                tab === 'login'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('request');
                setError(null);
                setReqSuccess(false);
              }}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                tab === 'request'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Request Access
            </button>
          </div>

          {tab === 'login' ? (
            <div className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label
                    htmlFor="auth-email"
                    className="mb-1 block font-mono text-[11px] font-semibold text-slate-600 uppercase"
                  >
                    Mission Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@eden.space"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#E14D2A] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="auth-password"
                    className="mb-1 block font-mono text-[11px] font-semibold text-slate-600 uppercase"
                  >
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#E14D2A] focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !hasBackendAuth}
                  className="w-full cursor-pointer rounded-lg bg-[#E14D2A] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#c93e1e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? 'Verifying Credentials...'
                    : hasBackendAuth
                      ? 'Sign In with Supabase Auth'
                      : 'Awaiting Backend Auth Endpoint'}
                </button>
              </form>

              {/* Quick Demo Role Preview (non-destructive) */}
              {!isAuthenticated && (
                <div className="border-t border-slate-200 pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                      <Shield className="h-3.5 w-3.5 text-[#0284C7]" />
                      Quick Role Preview (Judge / Demo)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {MISSION_ROLES.map((r) => {
                      const isSelected = activeRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            switchDemoRole(r.id);
                            onClose();
                          }}
                          className={`cursor-pointer rounded-xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? 'border-[#0284C7] bg-sky-50'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-[#0F172A]">{r.label}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-700">
                              {r.badge}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-600">
                            {r.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : reqSuccess ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
              <p className="mt-2 text-sm font-bold text-emerald-900">Access Request Submitted</p>
              <p className="mt-1 text-xs text-emerald-800">
                Mission Control Admin will review your role request shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setReqSuccess(false);
                  setTab('login');
                }}
                className="mt-4 cursor-pointer font-mono text-xs font-semibold text-[#0284C7] hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequest} className="space-y-3">
              <div>
                <label
                  htmlFor="req-name"
                  className="mb-1 block font-mono text-[11px] font-semibold text-slate-600 uppercase"
                >
                  Full Name
                </label>
                <input
                  id="req-name"
                  type="text"
                  required
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="Dr. Elena Rostova"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#E14D2A] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="req-email"
                  className="mb-1 block font-mono text-[11px] font-semibold text-slate-600 uppercase"
                >
                  Email
                </label>
                <input
                  id="req-email"
                  type="email"
                  required
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  placeholder="elena@eden.space"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#E14D2A] focus:outline-none"
                />
              </div>
              <div>
                <span className="mb-1.5 block font-mono text-[11px] font-semibold text-slate-600 uppercase">
                  Requested Role
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {MISSION_ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReqRole(r.id)}
                      className={`cursor-pointer rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-all ${
                        reqRole === r.id
                          ? 'border-[#E14D2A] bg-orange-50 text-[#0F172A]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="req-reason"
                  className="mb-1 block font-mono text-[11px] font-semibold text-slate-600 uppercase"
                >
                  Mission Justification
                </label>
                <textarea
                  id="req-reason"
                  rows={2}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Flight surgeon supporting Artemis crew biometrics..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#E14D2A] focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full cursor-pointer rounded-lg bg-[#0F172A] py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Submitting Request...' : 'Submit Access Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
