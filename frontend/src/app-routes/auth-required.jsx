import { getToken } from "../lib/local-storage";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const AuthRequired = () => {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
