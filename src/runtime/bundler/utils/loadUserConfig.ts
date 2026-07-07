import { loadConfigFromFile } from "vite";
import path from "path";
import fs from "fs-extra";

async function cleanupTimestampFiles() {
  try {
    const files = await fs.readdir(process.cwd());
    for (const file of files) {
      if (file.startsWith("revine.config.ts.timestamp-") && file.endsWith(".mjs")) {
        await fs.unlink(path.resolve(process.cwd(), file));
      }
    }
  } catch (e) {
    // Ignore error
  }
}

export async function loadUserConfig() {
  await cleanupTimestampFiles();
  const configPath = path.resolve(process.cwd(), "revine.config.ts");
  try {
    const result = await loadConfigFromFile(
      { command: "serve", mode: "development" },
      configPath
    );
    return result?.config || {};
  } catch (error) {
    console.error("Failed loading revine.config.ts:", error);
    // If .ts fails, try .js or just return empty
    try {
      const configPathJs = path.resolve(process.cwd(), "revine.config.js");
      const result = await loadConfigFromFile(
        { command: "serve", mode: "development" },
        configPathJs
      );
      return result?.config || {};
    } catch (e) {
      console.error("Failed loading revine.config.js:", e);
      return {};
    }
  }
}
