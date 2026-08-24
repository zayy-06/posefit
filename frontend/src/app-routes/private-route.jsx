import { getUserRole, getUser } from "../lib/local-storage";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
  const role = getUserRole();
  const user = getUser();
  const location = useLocation();

  if (!role) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/admin/login" replace />;
  }

  // Professional onboarding flow check
  if (role === "PROFESSIONAL") {
    const status = (user?.professionalStatus || "").toLowerCase();
    const isCompletePage = location.pathname === "/professional/profile/complete";

    if (
      (status === "invited" ||
        status === "pending_verification" ||
        status === "rejected") &&
      !isCompletePage
    ) {
      return <Navigate to="/professional/profile/complete" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
