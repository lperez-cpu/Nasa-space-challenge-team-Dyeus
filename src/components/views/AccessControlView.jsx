import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldCheck, Users, X } from 'lucide-react';
import * as api from '../../data/api';
import { useAuth } from '../../context/AuthContext';

export default function AccessControlView() {
  const { activeRole, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [notice, setNotice] = useState(null);

  const hasRequestsApi = typeof api.getAccessRequests === 'function';
  const hasProfilesApi = typeof api.getUserProfiles === 'function';
  const canApprove = activeRole === 'admin';

  const loadData = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [reqs, profs] = await Promise.all([
        hasRequestsApi ? api.getAccessRequests() : Promise.resolve([]),
        hasProfilesApi ? api.getUserProfiles() : Promise.resolve([]),
      ]);
      setRequests(Array.isArray(reqs) ? reqs : []);
      setProfiles(Array.isArray(profs) ? profs : []);
    } catch (err) {
      setNotice(err?.message || 'Role directory requires authenticated session with RLS clearance.');
    } finally {
      setLoading(false);
    }
  }, [hasRequestsApi, hasProfilesApi]);

  useEffect(() => {
    loadData();
  }, [loadData, activeRole, isAuthenticated]);

  async function handleStatus(id, status) {
    if (typeof api.updateAccessRequestStatus !== 'function') return;
    setActionId(id);
    try {
      await api.updateAccessRequestStatus(id, status);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      setNotice(err?.message || 'Unable to update request status.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Role Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-[#F4F6F9] text-[#E14D2A]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              ACCESS GOVERNANCE // ROLE: {activeRole.toUpperCase()}
            </p>
            <h2 className="text-base font-bold text-[#0F172A]">
              Crew Profiles &amp; Access Requests
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 transition-colors hover:border-[#0284C7] hover:text-[#0F172A] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!hasRequestsApi && !hasProfilesApi && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="font-bold">Backend Auth Endpoints Pending Sync</p>
          <p className="mt-1 font-mono text-[11px]">
            Waiting for Supabase Auth helpers (`getAccessRequests`, `getUserProfiles`) in `src/data/api.js`.
          </p>
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 font-mono text-xs text-sky-900">
          {notice}
        </div>
      )}

      {/* Access Requests */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A]">Access Requests</h3>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
            {requests.length} TOTAL
          </span>
        </div>

        {loading ? (
          <p className="font-mono text-xs text-slate-500">Loading access requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-xs text-slate-600">No access requests found for this session.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-[#0F172A]">
                      {req.full_name || req.email}
                    </p>
                    <span className="rounded bg-sky-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-900 uppercase">
                      {req.role_requested || req.requested_role}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-600">{req.email}</p>
                  {req.reason && (
                    <p className="mt-1 text-xs italic text-slate-600">&ldquo;{req.reason}&rdquo;</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.status || 'pending'}
                  </span>

                  {canApprove && req.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={actionId === req.id}
                        onClick={() => handleStatus(req.id, 'approved')}
                        aria-label={`Approve ${req.email}`}
                        className="cursor-pointer rounded-lg border border-emerald-300 bg-emerald-50 p-1.5 text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={actionId === req.id}
                        onClick={() => handleStatus(req.id, 'rejected')}
                        aria-label={`Reject ${req.email}`}
                        className="cursor-pointer rounded-lg border border-red-300 bg-red-50 p-1.5 text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Crew Profiles */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0284C7]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Registered Crew Profiles</h3>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
            {profiles.length} PROFILES
          </span>
        </div>

        {loading ? (
          <p className="font-mono text-xs text-slate-500">Loading profiles...</p>
        ) : profiles.length === 0 ? (
          <p className="text-xs text-slate-600">
            Sign in as Doctor or Admin to view full crew directory.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#0F172A]">
                    {p.full_name || 'Unnamed Crew'}
                  </p>
                  <p className="truncate font-mono text-[10px] text-slate-500">{p.id}</p>
                </div>
                <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 uppercase">
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
