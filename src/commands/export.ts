import fs from "fs-extra";
import path from "path";
import { pathToFileURL } from "url";
import { logStep, logSuccess, logError } from "../utils/logger.js";
import { loadUserConfig } from "../runtime/bundler/utils/loadUserConfig.js";
import chalk from "chalk";

interface PageMeta {
  filePath: string;
  routePath: string;
  mode: string;
  revalidate?: number;
  getStaticPaths?: () => Promise<string[]> | string[];
}

interface ISRManifest {
  [routePath: string]: {
    filePath: string;
    lastGenerated: number;
    revalidate: number;
  };
}

export async function runExportCommand() {
  const cwd = process.cwd();
  let userConfig: any = {};
  try {
    userConfig = await loadUserConfig();
  } catch (e) {
    // Ignore error
  }
  const outDir = userConfig.vite?.build?.outDir ?? "build";
  const buildDir = path.resolve(cwd, outDir);
  const serverEntryPath = path.resolve(buildDir, "server/entry-server.js");
  const clientHtmlPath = path.resolve(buildDir, "index.html");

  // Validate build exists
  if (!await fs.pathExists(serverEntryPath)) {
    logError("Server bundle not found. Run `revine build` first.");
    process.exit(1);
  }

  if (!await fs.pathExists(clientHtmlPath)) {
    logError("Client build not found. Run `revine build` first.");
    process.exit(1);
  }

  // Load server bundle
  const serverModule = await import(pathToFileURL(serverEntryPath).href);
  const { render, getPageMetadata } = serverModule;

  if (!render || !getPageMetadata) {
    logError("Server bundle is missing required exports. Rebuild with latest Revine.");
    process.exit(1);
  }

  // Read the client HTML shell template
  const htmlTemplate = await fs.readFile(clientHtmlPath, "utf-8");

  // Collect page metadata
  const pages: PageMeta[] = getPageMetadata();
  const ssgPages = pages.filter((p) => p.mode === "ssg");

  if (ssgPages.length === 0) {
    logStep("No SSG pages found. Nothing to export.");
    return;
  }

  logStep(`Found ${chalk.bold(ssgPages.length)} SSG page(s) to export.`);

  const isrManifest: ISRManifest = {};
  let exported = 0;

  for (const page of ssgPages) {
    let paths: string[];

    if (page.routePath.includes(":") || page.routePath.includes("*")) {
      // Dynamic route — needs getStaticPaths
      if (!page.getStaticPaths) {
        logError(
          `Dynamic SSG page ${chalk.cyan(page.filePath)} is missing getStaticPaths(). Skipping.`
        );
        continue;
      }
      paths = await page.getStaticPaths();
    } else {
      // Static route — single path
      paths = [page.routePath];
    }

    for (const routePath of paths) {
      logStep(`Exporting ${chalk.cyan(routePath)}...`);

      try {
        const { html, statusCode } = await render(`http://localhost${routePath}`);

        if (statusCode >= 300) {
          logError(`  → Got status ${statusCode}, skipping.`);
          continue;
        }

        // Inject SSR HTML into the template
        const fullHtml = htmlTemplate.replace(
          '<div id="root"></div>',
          `<div id="root" data-ssr="true">${html}</div>`
        );

        // Write to filesystem: /blog/hello → build/static/blog/hello/index.html
        const outputPath = routePath === "/"
          ? path.resolve(buildDir, "static/index.html")
          : path.resolve(buildDir, `static${routePath}/index.html`);

        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, fullHtml);
        exported++;

        // Track ISR pages
        if (page.revalidate) {
          isrManifest[routePath] = {
            filePath: outputPath,
            lastGenerated: Date.now(),
            revalidate: page.revalidate,
          };
        }
      } catch (err) {
        logError(`  → Failed to render ${routePath}: ${err}`);
      }
    }
  }

  // Write ISR manifest if any pages need revalidation
  if (Object.keys(isrManifest).length > 0) {
    const manifestPath = path.resolve(buildDir, "isr-manifest.json");
    await fs.writeJson(manifestPath, isrManifest, { spaces: 2 });
    logSuccess(`ISR manifest written with ${chalk.bold(Object.keys(isrManifest).length)} route(s).`);
  }

  logSuccess(
    `Exported ${chalk.bold(exported)} static page(s) to ${chalk.cyan("build/static/")}`
  );
}
