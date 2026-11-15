import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '../data/api';

const AuthContext = createContext(null);

export const MISSION_ROLES = [
  {
    id: 'paciente',
    label: 'Astronaut',
    badge: 'CREW',
    description: 'Personal biometrics, dietary therapeutics, seed pod dispenser and bio-bay status.',
  },
  {
    id: 'doctor',
    label: 'Flight Surgeon',
    badge: 'DOCTOR',
    description: 'Clinical telemetry review, crew health alerts and dietary protocol oversight.',
  },
  {
    id: 'programador',
    label: 'Systems Engineer',
    badge: 'ENGINEER',
    description: 'Hardware diagnostics, Supabase telemetry audit and access request oversight.',
  },
  {
    id: 'admin',
    label: 'Mission Admin',
    badge: 'ADMIN',
    description: 'Access request approvals, crew role directory and governance log.',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasBackendAuth =
    typeof api.getAuthSession === 'function' &&
    typeof api.signInWithPassword === 'function';

  const syncSession = useCallback(async () => {
    if (typeof api.getAuthSession !== 'function') {
      setLoading(false);
      return;
    }
    try {
      const session = await api.getAuthSession();
      setUser(session?.user ?? null);
      setProfile(session?.profile ?? null);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncSession();

    if (typeof api.onAuthStateChange === 'function') {
      const unsubscribe = api.onAuthStateChange((session) => {
        setUser(session?.user ?? null);
        setProfile(session?.profile ?? null);
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
    return undefined;
  }, [syncSession]);

  const signIn = useCallback(async (email, password) => {
    if (typeof api.signInWithPassword !== 'function') {
      throw new Error('Backend Auth endpoint is pending sync in src/data/api.js.');
    }
    const result = await api.signInWithPassword(email, password);
    setUser(result?.user ?? null);
    setProfile(result?.profile ?? null);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    if (typeof api.signOutAuth === 'function') {
      await api.signOutAuth();
    }
    setUser(null);
    setProfile(null);
  }, []);

  const submitAccessRequest = useCallback(async (payload) => {
    if (typeof api.submitAccessRequest !== 'function') {
      throw new Error('Access request endpoint is pending sync in src/data/api.js.');
    }
    return api.submitAccessRequest(payload);
  }, []);

  const activeRole = profile?.role || 'paciente';
  const isAuthenticated = Boolean(user);
  const displayName = profile?.full_name || user?.email || 'Authenticated Crew';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeRole,
        displayName,
        isAuthenticated,
        hasBackendAuth,
        loading,
        signIn,
        signOut,
        submitAccessRequest,
        refreshAuth: syncSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
