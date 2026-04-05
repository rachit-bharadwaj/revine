import { merge } from "lodash-es";
import path from "path";
import fs from "fs-extra";
import dotenv from "dotenv";
import { defaultViteConfig } from "./defaults/vite.js";
import { loadUserConfig } from "./utils/loadUserConfig.js";

interface UserConfig {
  vite?: Record<string, unknown>;
}

/**
 * Reads all .env files in the project root and returns a Vite `define` map
 * that replaces `process.env.REVINE_PUBLIC_*` with the actual string values
 * at build/dev time — exactly like Next.js does with process.env.
 *
 * Only REVINE_PUBLIC_ prefixed variables are exposed to the browser bundle.
 * All other variables are ignored for safety.
 */
function buildProcessEnvDefines(cwd: string): Record<string, string> {
  const defines: Record<string, string> = [];

  // Load .env, .env.local, .env.development / .env.production in priority order
  const envFiles = [
    ".env",
    ".env.local",
    `.env.${process.env.NODE_ENV || "development"}`,
    `.env.${process.env.NODE_ENV || "development"}.local`,
  ];

  for (const file of envFiles) {
    const filePath = path.resolve(cwd, file);
    if (fs.existsSync(filePath)) {
      const parsed = dotenv.parse(fs.readFileSync(filePath));
      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith("REVINE_PUBLIC_")) {
          // Replace process.env.REVINE_PUBLIC_FOO with the literal string value
          defines[`process.env.${key}`] = JSON.stringify(value);
        }
      }
    }
  }

  return defines;
}

export async function generateRevineViteConfig() {
  const cwd = process.cwd();

  // Load the user's revine.config.ts
  const userConfig = (await loadUserConfig()) as UserConfig;

  // Merge user "vite" overrides with your default config
  const finalConfig = merge({}, defaultViteConfig, userConfig.vite || {});

  // Inject process.env.REVINE_PUBLIC_* defines so users can write:
  //   const token = process.env.REVINE_PUBLIC_GITHUB_TOKEN;
  // These are statically replaced at build time — nothing leaks to the bundle.
  const processEnvDefines = buildProcessEnvDefines(cwd);
  finalConfig.define = merge({}, processEnvDefines, finalConfig.define || {});

  // Dynamically add Tailwind if present in the project
  try {
    const projectPkgPath = path.resolve(cwd, "package.json");
    const pkg = await fs.readJson(projectPkgPath);
    const hasTailwind =
      pkg.devDependencies?.["@tailwindcss/vite"] ||
      pkg.dependencies?.["@tailwindcss/vite"];

    if (hasTailwind) {
      const tailwindModule = "@tailwindcss/vite";
      const { default: tailwindcss } = (await import(tailwindModule)) as any;
      finalConfig.plugins = [...(finalConfig.plugins || []), tailwindcss()];
    }
  } catch (e) {
    // Ignore error if package.json not found or tailwind not importable
  }

  return finalConfig as any;
}
