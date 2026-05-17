import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" state={{ from: location }} replace />;
}
