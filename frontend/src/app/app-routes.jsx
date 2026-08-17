import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAdminToken, getAdminUser } from "../lib/admin-auth";

import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminProfessionals from "../pages/admin/AdminProfessionals";
import AdminProfessionalRequests from "../pages/admin/AdminProfessionalRequests";
import AdminPayments from "../pages/admin/AdminPayments";
import AdminSettings from "../pages/admin/AdminSettings";

function ProtectedAdminRoute({ children }) {
  const token = getAdminToken();
  const user = getAdminUser();
  if (!token || user?.role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function GuestRoute({ children }) {
  const token = getAdminToken();
  const user = getAdminUser();
  if (token && user?.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path="/admin/login"
          element={
            <GuestRoute>
              <AdminLogin />
            </GuestRoute>
          }
        />

        {/* Protected admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedAdminRoute>
              <AdminUsers />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/professionals"
          element={
            <ProtectedAdminRoute>
              <AdminProfessionals />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedAdminRoute>
              <AdminProfessionalRequests />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedAdminRoute>
              <AdminPayments />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedAdminRoute>
              <AdminSettings />
            </ProtectedAdminRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;