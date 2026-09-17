/**
 * AuthContext — provides authentication state and actions to the entire app.
 *
 * State:
 *   user        — the logged-in user object or null
 *   isLoading   — true while the initial session check is in progress
 *
 * Actions:
 *   login(email, password)  — authenticates, stores access token in memory
 *   logout()                — clears state and calls the logout API
 *   setUser(user)           — used after signup/verify to update state
 *
 * On mount: attempts a silent refresh to restore the session across page reloads.
 * The access token is never persisted to localStorage; only the httpOnly
 * refresh cookie survives a reload, so we probe the refresh endpoint on startup.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken } from '../../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Silent refresh on mount ──
  // If the httpOnly cookie is present, this will succeed and restore the session.
  useEffect(() => {
    api.post('/auth/refresh')
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setUserState(res.data.user);
      })
      .catch(() => {
        // No valid session — start unauthenticated (not an error)
        clearAccessToken();
        setUserState(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Listen for forced logouts from the Axios interceptor ──
  useEffect(() => {
    const handleForceLogout = () => {
      clearAccessToken();
      setUserState(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUserState(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Always clear client state, even if the server call fails
      clearAccessToken();
      setUserState(null);
    }
  }, []);

  const setUser = useCallback((u) => setUserState(u), []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
