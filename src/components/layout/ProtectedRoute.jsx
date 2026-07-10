import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-brand-900/40">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
