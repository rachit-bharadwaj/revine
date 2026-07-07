import react from "@vitejs/plugin-react";
import path from "path";
import { revinePlugin } from "../revinePlugin.js";

import { createRequire } from "module";

const require = createRequire(import.meta.url);

const resolveProjectDep = (pkgName: string) => {
  try {
    return require.resolve(pkgName, { paths: [process.cwd()] });
  } catch (e) {
    return pkgName;
  }
};

const resolveProjectDir = (pkgName: string) => {
  try {
    const packageJsonPath = require.resolve(`${pkgName}/package.json`, { paths: [process.cwd()] });
    return path.dirname(packageJsonPath);
  } catch (e) {
    return pkgName;
  }
};

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
      "react/jsx-runtime": resolveProjectDep("react/jsx-runtime"),
      "react/jsx-dev-runtime": resolveProjectDep("react/jsx-dev-runtime"),
      "react-dom/server": resolveProjectDep("react-dom/server"),
      "react-router-dom/server": resolveProjectDep("react-router-dom/server"),
      "react": resolveProjectDir("react"),
      "react-dom": resolveProjectDir("react-dom"),
      "react-router-dom": resolveProjectDir("react-router-dom"),
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
    external: ["react", "react-dom"],
  },
};

