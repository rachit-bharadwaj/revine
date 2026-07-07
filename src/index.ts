#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createProject } from "./commands/createProject.js";
import { runExportCommand } from "./commands/export.js";
import { runServeCommand } from "./commands/server.js";
import { printDevServerInfo, logStep, logSuccess, logBrand } from "./utils/logger.js";
import chalk from "chalk";

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

const runViteCommand = async (command: string, options?: { ssr?: boolean }) => {
  const configPath = path.resolve(__dirname, "runtime/bundler/vite.config.js");

  // Set the config path as env variable — vite reads VITE_CONFIG_FILE
  process.env.VITE_CONFIG_PATH = configPath;

  // Dynamically import vite's programmatic API
  const vite = await import("vite");

  // Load the revine config
  const { generateRevineViteConfig } = await import(
    path.resolve(__dirname, "runtime/bundler/generateConfig.js")
  );
  const config = await generateRevineViteConfig();

  const { loadUserConfig } = await import(
    path.resolve(__dirname, "runtime/bundler/utils/loadUserConfig.js")
  );
  let userConfig: any = {};
  try {
    userConfig = await loadUserConfig();
  } catch (e) {
    // Ignore config loading error
  }
  const defaultMode = userConfig.rendering?.default ?? "csr";

  if (command === "dev") {
    const startTime = Date.now();
    const isSSR = options?.ssr || defaultMode === "ssr" || defaultMode === "ssg";

    if (isSSR) {
      // SSR dev mode: Vite as middleware + server-rendered responses
      const server = await vite.createServer({
        ...config,
        configFile: false,
        server: { ...config.server, middlewareMode: true },
        appType: "custom",
      });
      const { createSSRDevServer } = await import("./commands/dev-ssr.js");
      await createSSRDevServer(server, config, pkg.version, startTime);
    } else {
      // CSR dev mode: standard Vite dev server (current behavior)
      const server = await vite.createServer({
        ...config,
        configFile: false, // we pass config directly, no file needed
      });
      await server.listen();
      const port = server.config.server.port || 3000;
      printDevServerInfo(pkg.version, port, startTime);
    }
  } else if (command === "build") {
    const startTime = Date.now();
    const outDir = config.build?.outDir ?? "build";

    logStep("Building client bundle...");
    await vite.build({
      ...config,
      configFile: false,
    });

    logStep("Building server bundle for SSR/SSG...");
    const serverEntry = path.resolve(__dirname, "runtime/entry-server.js");
    
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const resolveProjectDepPath = (pkgName: string) => {
      try {
        const packageJsonPath = require.resolve(`${pkgName}/package.json`, { paths: [process.cwd()] });
        return path.dirname(packageJsonPath);
      } catch (e) {
        return "";
      }
    };
    const projectReactDir = resolveProjectDepPath("react");
    const projectReactDomDir = resolveProjectDepPath("react-dom");
    const projectRouterDomDir = resolveProjectDepPath("react-router-dom");

    await vite.build({
      ...config,
      configFile: false,
      build: {
        ...(config.build || {}),
        ssr: serverEntry,
        outDir: path.resolve(process.cwd(), outDir, "server"),
        emptyOutDir: true,
        rollupOptions: {
          ...(config.build?.rollupOptions || {}),
          external: (id) => {
            if (
              id === "react" ||
              id === "react-dom" ||
              id === "react-router-dom" ||
              (projectReactDir && id.includes(projectReactDir)) ||
              (projectReactDomDir && id.includes(projectReactDomDir)) ||
              (projectRouterDomDir && id.includes(projectRouterDomDir))
            ) {
              return true;
            }
            if (typeof config.build?.rollupOptions?.external === "function") {
              return config.build.rollupOptions.external(id);
            }
            if (Array.isArray(config.build?.rollupOptions?.external)) {
              return config.build.rollupOptions.external.includes(id);
            }
            return false;
          }
        }
      },
    });

    const duration = Date.now() - startTime;
    logSuccess(`Build completed in ${chalk.bold(duration)}ms`);

    // SSG static export automatically at the end of the build if defaultMode is ssg or if any SSG page exists
    try {
      const serverEntryPath = path.resolve(process.cwd(), outDir, "server/entry-server.js");
      const fsExtra = await import("fs-extra");
      if (await fsExtra.pathExists(serverEntryPath)) {
        const { pathToFileURL } = await import("url");
        const serverModule = await import(pathToFileURL(serverEntryPath).href);
        const pages = serverModule.getPageMetadata?.() ?? [];
        const hasSSG = defaultMode === "ssg" || pages.some((p: any) => p.mode === "ssg");
        if (hasSSG) {
          logStep("Pre-rendering SSG pages to static HTML...");
          await runExportCommand();
        }
      }
    } catch (e) {
      // Ignore or log error
    }
  } else if (command === "preview") {
    const startTime = Date.now();
    const server = await vite.preview({
      ...config,
      configFile: false,
    });
    const port = server.config.preview.port || 3000;
    printDevServerInfo(pkg.version, port, startTime);
  }
};

// Root command — handles: npx revine <project-name>
program
  .version(pkg.version)
  .argument("[project-name/command]")
  .option("-f, --force", "Force creation in non-empty directory")
  .action(async (arg: string | undefined, options: { force?: boolean }) => {
    const knownCommands = ["create", "dev", "build", "preview", "export", "serve", "start"];
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
  .option("--ssr", "Enable SSR in development mode")
  .action((options: { ssr?: boolean }) => runViteCommand("dev", options));

program
  .command("build")
  .description("Build the project for production (client + server bundles)")
  .action(() => runViteCommand("build"));

program
  .command("preview")
  .description("Preview the production build")
  .action(() => runViteCommand("preview"));

program
  .command("export")
  .description("Pre-render SSG pages to static HTML")
  .action(async () => {
    await runExportCommand();
  });

program
  .command("serve")
  .description("Start the production SSR server")
  .option("-p, --port <port>", "Port number", "3000")
  .action(async (options: { port: string }) => {
    await runServeCommand(parseInt(options.port));
  });

program
  .command("start")
  .description("Start the production SSR server")
  .option("-p, --port <port>", "Port number", "3000")
  .action(async (options: { port: string }) => {
    await runServeCommand(parseInt(options.port));
  });

logBrand();

program.parse(process.argv);
