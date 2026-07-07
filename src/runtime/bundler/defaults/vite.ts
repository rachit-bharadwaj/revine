import react from "@vitejs/plugin-react";
import path from "path";
import { revinePlugin } from "../revinePlugin.js";

export const defaultViteConfig = {
  plugins: [react(), revinePlugin()],
  logLevel: "silent",
  // Only expose env variables prefixed with REVINE_PUBLIC_ to the browser bundle.
  // Variables without this prefix are never included in client-side code.
  envPrefix: "REVINE_PUBLIC_",
  resolve: {
    alias: {
      // @ always points to the user's project /src directory
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  server: {
    clearScreen: false,
    open: false,
    port: 3000,
    host: true,
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
  },
  ssr: {
    // Ensure revine itself is bundled into the SSR output
    // so the virtual module resolver (revinePlugin) can work
    noExternal: ["revine"],
    external: ["react", "react-dom", "react-router-dom"],
  },
};

