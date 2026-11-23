/**
 * routes/guards.jsx - client-side route guards (UX only; the API enforces real authorization)
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AdminRoute({ children }) {
  const { auth, isAdmin } = useAuth();
  if (!auth) return <Navigate to="/admin-login" replace />;
  if (!isAdmin) return <Navigate to="/employee/dashboard" replace />;
  return children;
}

export function EmployeeRoute({ children }) {
  const { auth, isEmployee } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!isEmployee) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

export function PublicRoute({ children }) {
  const { auth, isAdmin, isEmployee } = useAuth();
  if (auth && isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (auth && isEmployee) return <Navigate to="/employee/dashboard" replace />;
  return children;
}
