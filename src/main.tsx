import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import { ThemeContextProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";

// In production, call the backend host directly. In dev, keep /api relative so Vite proxy handles it (avoids CORS).
const API_BASE_URL = import.meta.env.PROD
  ? (
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_LOCAL_API_URL ||
      ""
    ).replace(/\/$/, "")
  : "";

// Global fetch interceptor: resolve /api/ against backend URL and append JWT
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem("token");
  const isApi = typeof input === "string" && input.startsWith("/api/");
  if (isApi) {
    if (API_BASE_URL) {
      input = `${API_BASE_URL}${input}`;
    }
    if (token) {
      init = init || {};
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeContextProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </ThemeContextProvider>
    </BrowserRouter>
  </Provider>
);
