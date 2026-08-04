import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    var apiBaseUrl = env.VITE_API_BASE_URL || env.VITE_LOCAL_API_URL || "http://localhost:5000";
    return {
        plugins: [react()],
        server: {
            port: 3000,
            open: true,
            proxy: {
                "/api": {
                    target: apiBaseUrl,
                    changeOrigin: true,
                    secure: true,
                    timeout: 120000,
                },
            },
        },
    };
});
