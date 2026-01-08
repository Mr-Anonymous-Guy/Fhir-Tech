import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const allowedEnvKeys = [
  "VITE_API_BASE_URL",
  "VITE_SUPABASE_PROJECT_ID",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_APP_ENV",
  "VITE_MONGODB_URI",
];

const safeEnvReplacements = allowedEnvKeys.reduce<Record<string, string>>(
  (acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(process.env[key] ?? "");
    return acc;
  },
  {}
);

safeEnvReplacements["process.env.NODE_ENV"] = JSON.stringify(
  process.env.NODE_ENV ?? "development"
);
safeEnvReplacements["process.env.npm_package_version"] = JSON.stringify(
  process.env.npm_package_version ?? "0.0.0"
);

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
  },
  define: safeEnvReplacements,
});

