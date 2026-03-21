// ============================================================
//  App.jsx — Root component with routing
// ============================================================

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages — we'll create these next
import Login      from "./pages/auth/Login";
import Register   from "./pages/auth/Register";
import Dashboard  from "./pages/dashboard/Dashboard";
import ServerList from "./pages/servers/ServerList";
import ServerDetail from "./pages/servers/ServerDetail";
import AdminPanel from "./pages/admin/AdminPanel";
import Settings   from "./pages/settings/Settings";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/servers" element={
        <ProtectedRoute><ServerList /></ProtectedRoute>
      } />
      <Route path="/servers/:id" element={
        <ProtectedRoute><ServerDetail /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;