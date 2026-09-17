import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ProtectedRoute — redirects to /login if the user is not authenticated.
 * Passes the intended destination via location state so LoginPage can
 * redirect back after successful login (and apply a deferred vote intent).
 *
 * Renders null while the initial session check is in flight to avoid a
 * flash of the login page for users with a valid refresh cookie.
 */
export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null; // Avoid redirect flicker during silent refresh
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
