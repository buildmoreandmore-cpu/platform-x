import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
