import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { store } from "../app/store";
import { showToast } from "../redux/toast/toastSlice";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, user: object) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise from localStorage so page-refresh keeps the session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem("token") !== null
  );

  const login = useCallback((token: string, user: object) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  }, []);

  // Listen for global session expiry events (triggered by 401 interceptor)
  useEffect(() => {
    const handleExpired = () => {
      logout();
      store.dispatch(
        showToast({
          message: "Your session has expired. Please log in again.",
          severity: "warning",
        })
      );
    };

    window.addEventListener("auth-session-expired", handleExpired);
    return () => window.removeEventListener("auth-session-expired", handleExpired);
  }, [logout]);

  // Tab visibility check: verify session when user returns to tab after hours
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && localStorage.getItem("token")) {
        fetch("/api/auth/profile").catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
