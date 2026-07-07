import http from "http";
import fs from "fs-extra";
import path from "path";
import { printDevServerInfo } from "../utils/logger.js";
import { createRequire } from "module";
import { pathToFileURL } from "url";

async function findCssFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  if (!(await fs.pathExists(dir))) return files;
  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.resolve(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      files.push(...(await findCssFiles(filePath)));
    } else if (file.endsWith(".css")) {
      files.push(filePath);
    }
  }
  return files;
}

/**
 * Creates a development SSR server using Vite's middleware mode.
 * This gives full HMR support while rendering pages on the server.
 */
export async function createSSRDevServer(
  viteServer: any,
  config: any,
  version: string,
  startTime: number,
) {
  const port = config.server?.port || 3000;

  const app = http.createServer((req, res) => {
    const url = req.url || "/";

    if (url === "/assets/index.css") {
      (async () => {
        try {
          const srcDir = path.resolve(process.cwd(), "src");
          const cssFiles = await findCssFiles(srcDir);
          let cssContent = "";
          for (const file of cssFiles) {
            const cssModule = await viteServer.ssrLoadModule(file);
            cssContent += (cssModule.default || cssModule || "") + "\n";
          }
          res.writeHead(200, { "Content-Type": "text/css" });
          res.end(cssContent);
        } catch (e: any) {
          console.error("Error loading dev CSS:", e);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(e.message);
        }
      })();
      return;
    }

    viteServer.middlewares(req, res, async () => {
      try {
        // Read and transform index.html through Vite's pipeline
        const templatePath = path.resolve(process.cwd(), "index.html");
        let template = await fs.readFile(templatePath, "utf-8");
        template = await viteServer.transformIndexHtml(url, template);

        // Load the server entry through Vite's SSR module loader
        // This supports HMR — modules are re-evaluated on change
        const { render, getPageMetadata } = await viteServer.ssrLoadModule(
          "revine/entry-server"
        );

        let isCSR = false;
        try {
          const pages = getPageMetadata();
          const require = createRequire(import.meta.url);
          const projectRouterDomPath = require.resolve("react-router-dom", { paths: [process.cwd()] });
          const { matchPath } = await import(pathToFileURL(projectRouterDomPath).href);
          const parsedUrl = new URL(url, "http://localhost");
          for (const p of pages) {
            const match = matchPath({ path: p.routePath, end: true }, parsedUrl.pathname);
            if (match && p.mode === "csr") {
              isCSR = true;
              break;
            }
          }
        } catch (e) {}

        if (isCSR) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(template);
          return;
        }

        const { html, statusCode, redirect } = await render(
          `http://localhost:${port}${url}`
        );

        if (redirect) {
          res.writeHead(statusCode, { Location: redirect });
          res.end();
          return;
        }

        const fullHtml = template.replace(
          '<div id="root"></div>',
          `<div id="root" data-ssr="true">${html}</div>`
        );

        res.writeHead(statusCode, { "Content-Type": "text/html" });
        res.end(fullHtml);
      } catch (e: any) {
        // Fix the stack trace for Vite-transformed modules
        viteServer.ssrFixStacktrace(e);
        console.error("SSR Dev Error:", e);
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(`<pre style="color:red">${e.stack || e.message}</pre>`);
      }
    });
  });


  app.listen(port, () => {
    printDevServerInfo(version, port, startTime);
  });
}
