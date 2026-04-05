// This module is intentionally empty at the source level.
// `revine/routing` is a virtual module resolved by the Revine Vite plugin at build/dev time.
// The actual router is injected via the plugin's resolveId/load hooks.
//
// The type declaration below tells TypeScript that `router` exists on this module
// so consumers don't get ts(2305) errors.
import { createBrowserRouter } from "react-router-dom";

declare module "revine/routing" {
  export const router: ReturnType<typeof createBrowserRouter>;
}

export {};
