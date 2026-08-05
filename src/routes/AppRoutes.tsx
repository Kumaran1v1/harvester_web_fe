import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./routeConstants";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "./PrivateRoute";
import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import PersonalDetails from "../pages/PersonalDetails/PersonalDetails";
import Bills from "../pages/Bills/Bills";
import PendingBills from "../pages/PendingBills/PendingBills";
import Operators from "../pages/Operators/Operators";
import BunkDetails from "../pages/BunkDetails/BunkDetails";

export const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Login />}
      />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.PERSONAL_DETAILS} element={<PersonalDetails />} />
          <Route path={ROUTES.BILLS} element={<Bills />} />
          <Route path={ROUTES.PENDING_BILLS} element={<PendingBills />} />
          <Route path={ROUTES.OPERATORS} element={<Operators />} />
          <Route path={ROUTES.BUNK_DETAILS} element={<BunkDetails />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
