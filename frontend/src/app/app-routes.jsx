import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAdminToken, getAdminUser } from "../lib/admin-auth";
import { getProToken, getProUser } from "../lib/professional-auth";

import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminProfessionals from "../pages/admin/AdminProfessionals";
import AdminProfessionalRequests from "../pages/admin/AdminProfessionalRequests";
import AdminPayments from "../pages/admin/AdminPayments";
import AdminSettings from "../pages/admin/AdminSettings";

// Professional Pages
import CompleteProfessionalProfile from "../pages/professional/CompleteProfessionalProfile";
import ProfessionalDashboard from "../pages/professional/ProfessionalDashboard";
import ProfessionalProfileSettings from "../pages/professional/ProfessionalProfileSettings";
import ProfessionalBookings from "../pages/professional/ProfessionalBookings";
import ProfessionalAvailability from "../pages/professional/ProfessionalAvailability";
import ProfessionalEarnings from "../pages/professional/ProfessionalEarnings";

// Public Professional Discovery Pages
import FindProfessionals from "../pages/public/FindProfessionals";
import PublicProfessionalProfile from "../pages/public/PublicProfessionalProfile";

function ProtectedAdminRoute({ children }) {
  const token = getAdminToken();
  const user = getAdminUser();
  if (!token || user?.role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

// Blocks dashboard/booking/earnings pages if professional profile is not approved
function ProtectedProfessionalRoute({ children }) {
  const token = getProToken() || getAdminToken();
  const user = getProUser() || getAdminUser();

  if (!token || user?.role !== "PROFESSIONAL") {
    return <Navigate to="/admin/login" replace />;
  }

  // If status is not approved, force profile completion/review screen
  const status = user?.professionalStatus?.toLowerCase();
  if (status === "invited" || status === "pending_verification" || status === "rejected") {
    return <Navigate to="/professional/profile/complete" replace />;
  }

  return children;
}

// Allows access to Profile Completion page for any authenticated professional
function ProtectedOnboardingRoute({ children }) {
  const token = getProToken() || getAdminToken();
  const user = getProUser() || getAdminUser();

  if (!token || user?.role !== "PROFESSIONAL") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const adminToken = getAdminToken();
  const adminUser = getAdminUser();
  if (adminToken && adminUser?.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const proToken = getProToken();
  const proUser = getProUser();
  if (proToken && proUser?.role === "PROFESSIONAL") {
    const status = proUser?.professionalStatus?.toLowerCase();
    if (status === "approved") {
      return <Navigate to="/professional/dashboard" replace />;
    }
    return <Navigate to="/professional/profile/complete" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Professional Discovery & Profile */}
        <Route path="/professionals" element={<FindProfessionals />} />
        <Route path="/professionals/:id" element={<PublicProfessionalProfile />} />

        {/* Login */}
        <Route
          path="/admin/login"
          element={
            <GuestRoute>
              <AdminLogin />
            </GuestRoute>
          }
        />

        {/* Protected Admin Routes */}
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

        {/* Professional Onboarding / Complete Profile */}
        <Route
          path="/professional/profile/complete"
          element={
            <ProtectedOnboardingRoute>
              <CompleteProfessionalProfile />
            </ProtectedOnboardingRoute>
          }
        />

        {/* Protected Professional Live Routes (Requires Approved Status) */}
        <Route
          path="/professional/dashboard"
          element={
            <ProtectedProfessionalRoute>
              <ProfessionalDashboard />
            </ProtectedProfessionalRoute>
          }
        />
        <Route
          path="/professional/profile"
          element={
            <ProtectedProfessionalRoute>
              <ProfessionalProfileSettings />
            </ProtectedProfessionalRoute>
          }
        />
        <Route
          path="/professional/bookings"
          element={
            <ProtectedProfessionalRoute>
              <ProfessionalBookings />
            </ProtectedProfessionalRoute>
          }
        />
        <Route
          path="/professional/availability"
          element={
            <ProtectedProfessionalRoute>
              <ProfessionalAvailability />
            </ProtectedProfessionalRoute>
          }
        />
        <Route
          path="/professional/earnings"
          element={
            <ProtectedProfessionalRoute>
              <ProfessionalEarnings />
            </ProtectedProfessionalRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/professionals" replace />} />
        <Route path="*" element={<Navigate to="/professionals" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;