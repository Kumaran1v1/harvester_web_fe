import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routeConstants";

export const PrivateRoute: React.FC = () => {
  // Simulate checking token in localStorage
  const isAuthenticated = localStorage.getItem("token") !== null;

  // For initial scaffolding/development convenience, if you want to test without logging in:
  // Set default fallback to true if not initialized
  const bypassAuthForDev = true; 

  if (!isAuthenticated && !bypassAuthForDev) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
