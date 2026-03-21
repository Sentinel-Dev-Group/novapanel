// ============================================================
//  ProtectedRoute.jsx — Redirects to login if not authed
// ============================================================

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, accessToken } = useAuthStore();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !["admin", "root"].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;