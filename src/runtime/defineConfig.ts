import type { UserConfig } from "vite";

export interface RevineConfig {
  vite?: UserConfig;
}

export function defineConfig(config: RevineConfig): RevineConfig {
  return config;
}