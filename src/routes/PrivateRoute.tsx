import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routeConstants";
import { useAuth } from "../context/AuthContext";

export const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
