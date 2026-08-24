import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

// Public Pages
import FindProfessionals from "../pages/public/FindProfessionals";
import PublicProfessionalProfile from "../pages/public/PublicProfessionalProfile";

// Auth / Login
import AdminLogin from "../pages/admin/AdminLogin";

// Admin Pages
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

// Route Guards
import { AuthRequired } from "./auth-required";
import PrivateRoute from "./private-route";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- Public Routes ---------- */}
        <Route path="/professionals" element={<FindProfessionals />} />
        <Route path="/professionals/:id" element={<PublicProfessionalProfile />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ---------- Protected Routes ---------- */}
        <Route element={<AuthRequired />}>
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <AdminUsers />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/professionals"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <AdminProfessionals />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <AdminProfessionalRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <AdminPayments />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <AdminSettings />
              </PrivateRoute>
            }
          />

          {/* Professional Onboarding Route */}
          <Route
            path="/professional/profile/complete"
            element={
              <PrivateRoute allowedRoles={["PROFESSIONAL"]}>
                <CompleteProfessionalProfile />
              </PrivateRoute>
            }
          />

          {/* Professional Routes */}
          <Route
            path="/professional/dashboard"
            element={
              <PrivateRoute allowedRoles={["PROFESSIONAL"]}>
                <ProfessionalDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/professional/profile"
            element={
              <PrivateRoute allowedRoles={["PROFESSIONAL"]}>
                <ProfessionalProfileSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/professional/bookings"
            element={
              <PrivateRoute allowedRoles={["PROFESSIONAL"]}>
                <ProfessionalBookings />
              </PrivateRoute>
            }
          />
          <Route
            path="/professional/availability"
            element={
              <PrivateRoute allowedRoles={["PROFESSIONAL"]}>
                <ProfessionalAvailability />
              </PrivateRoute>
            }
          />
          <Route
            path="/professional/earnings"
            element={
              <PrivateRoute allowedRoles={["PROFESSIONAL"]}>
                <ProfessionalEarnings />
              </PrivateRoute>
            }
          />
        </Route>

        {/* ---------- Fallbacks ---------- */}
        <Route path="/" element={<Navigate to="/professionals" replace />} />
        <Route path="*" element={<Navigate to="/professionals" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
