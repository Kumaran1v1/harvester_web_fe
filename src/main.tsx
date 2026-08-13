import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import { ThemeContextProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";

// Always send /api calls to the env backend base URL
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_LOCAL_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

// Global fetch interceptor: resolve /api/ against backend URL, append JWT & handle 401 Session Expiration
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem("token");
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const isApi = urlStr.startsWith("/api/") || urlStr.includes("/api/");

  let targetInput = input;
  if (isApi) {
    if (typeof input === "string" && input.startsWith("/api/")) {
      targetInput = `${API_BASE_URL}${input}`;
    }
    if (token) {
      init = init || {};
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const response = await originalFetch(targetInput, init);

  // If response is 401 Unauthorized (and not the login attempt itself), session has expired
  if (response.status === 401 && !urlStr.includes("/api/auth/login")) {
    const existingToken = localStorage.getItem("token");
    if (existingToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth-session-expired"));
    }
  }

  return response;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeContextProvider>
        <AuthProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </AuthProvider>
      </ThemeContextProvider>
    </BrowserRouter>
  </Provider>
);
