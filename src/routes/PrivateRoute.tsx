import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routeConstants";

export const PrivateRoute: React.FC = () => {
  const isAuthenticated = localStorage.getItem("token") !== null;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
