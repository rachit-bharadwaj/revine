#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createProject } from "./commands/createProject.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.resolve(__dirname, "../package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

const program = new Command();

const handleProjectCreation = async (
  projectName: string,
  options: { force?: boolean },
) => {
  await createProject(projectName, options);
};

const runViteCommand = async (command: string) => {
  const configPath = path.resolve(__dirname, "runtime/bundler/vite.config.js");

  // Set the config path as env variable — vite reads VITE_CONFIG_FILE
  process.env.VITE_CONFIG_PATH = configPath;

  // Dynamically import vite's programmatic API
  const vitePath = path.resolve(
    process.cwd(),
    "node_modules/vite/dist/node/index.js",
  );
  const vite = await import(vitePath);

  // Load the revine config
  const { generateRevineViteConfig } = await import(
    path.resolve(__dirname, "runtime/bundler/generateConfig.js")
  );
  const config = await generateRevineViteConfig();

  if (command === "dev") {
    const server = await vite.createServer({
      ...config,
      configFile: false, // we pass config directly, no file needed
    });
    await server.listen();
    server.printUrls();
  } else if (command === "build") {
    await vite.build({
      ...config,
      configFile: false,
    });
  } else if (command === "preview") {
    const server = await vite.preview({
      ...config,
      configFile: false,
    });
    server.printUrls();
  }
};

// Root command — handles: npx revine <project-name>
program
  .version(pkg.version)
  .argument("[project-name/command]")
  .option("-f, --force", "Force creation in non-empty directory")
  .action(async (arg: string | undefined, options: { force?: boolean }) => {
    const knownCommands = ["create", "dev", "build", "preview"];
    if (arg && !knownCommands.includes(arg)) {
      await handleProjectCreation(arg, options);
    } else if (!arg) {
      program.help();
    }
  });

// npx revine create <project-name>
program
  .command("create")
  .argument("<project-name>")
  .option("-f, --force", "Force creation in non-empty directory")
  .action(async (projectName: string, options: { force?: boolean }) => {
    await handleProjectCreation(projectName, options);
  });

program
  .command("dev")
  .description("Start the development server")
  .action(() => runViteCommand("dev"));

program
  .command("build")
  .description("Build the project for production")
  .action(() => runViteCommand("build"));

program
  .command("preview")
  .description("Preview the production build")
  .action(() => runViteCommand("preview"));

program.parse(process.argv);

export { defineConfig } from "./runtime/defineConfig.js";
export {
  Link,
  NavLink,
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
  Outlet,
} from "react-router-dom";
export type { LinkProps, NavLinkProps } from "react-router-dom";
export type { LayoutProps } from "./runtime/types.js";
