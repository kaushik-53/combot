/**
 * Axios instance with single-flight refresh token interceptor.
 *
 * Access token is stored in a module-level closure (never localStorage).
 * Concurrent 401s all await the same refresh promise rather than each
 * attempting their own rotation — prevents a race where one refresh
 * succeeds and the others present an already-rotated token.
 */
import axios from 'axios';

// ─── In-memory access token ───────────────────────────────────────────────────
// This is intentionally NOT in localStorage — XSS cannot read module scope.
let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const getAccessToken = ()      => _accessToken;
export const clearAccessToken = ()    => { _accessToken = null; };

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:        '/api',
  withCredentials: true, // Send the httpOnly refresh cookie on /api/auth/refresh calls
});

// Attach access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Single-flight refresh ────────────────────────────────────────────────────
// Shared promise: the first 401 starts a refresh; all subsequent concurrent
// 401s wait on the same promise. When it resolves, all retry with the new token.
let refreshPromise = null;

async function attemptRefresh() {
  // Only one refresh call in flight at a time
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .finally(() => {
        // Reset so the next 401 after a completed refresh can start fresh
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only intercept 401s that haven't already been retried
    if (
      error.response?.status === 401 &&
      !original._retry &&
      // Don't intercept 401s from the refresh endpoint itself (avoid infinite loop)
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      try {
        await attemptRefresh();
        // Retry the original request — the request interceptor will attach the new token
        return api(original);
      } catch {
        // Refresh failed (expired, revoked, or reuse detected) — clear state
        clearAccessToken();
        // Redirect to login; the AuthContext will handle the cleared state
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
