import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireManager() {
  const { isManager } = useAuth();
  if (!isManager) return <Navigate to="/app/compliance" replace />;
  return <Outlet />;
}
