import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import { ThemeContextProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";

// Global fetch interceptor to append JWT token automatically to all /api/ calls
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem("token");
  const isApi = typeof input === "string" && input.startsWith("/api/");
  if (token && isApi) {
    init = init || {};
    init.headers = {
      ...init.headers,
      "Authorization": `Bearer ${token}`
    };
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
