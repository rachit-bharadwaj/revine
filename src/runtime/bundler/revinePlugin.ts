const VIRTUAL_ROUTING_ID = "\0revine:routing";

export function revinePlugin(): any {
  return {
    name: "revine",

    resolveId(id: string) {
      if (id === "revine/routing") {
        return VIRTUAL_ROUTING_ID;
      }
    },

    load(id: string) {
      if (id === VIRTUAL_ROUTING_ID) {
        return `
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense, createElement } from "react";

const notFoundModules = import.meta.glob("/src/NotFound.tsx", { eager: true });
const NotFoundComponent = Object.values(notFoundModules)[0]?.default;

const pages = import.meta.glob("/src/pages/**/*.tsx");
const layoutModules = import.meta.glob("/src/pages/**/layout.tsx", { eager: true });
const loadingModules = import.meta.glob("/src/pages/**/loading.tsx", { eager: true });

function getLayoutsForPath(filePath) {
  const parts = filePath.split("/");
  parts.pop();
  const layouts = [];
  const accumulated = [];
  for (const part of parts) {
    accumulated.push(part);
    const key = accumulated.join("/") + "/layout.tsx";
    if (layoutModules[key] && layoutModules[key].default) {
      layouts.push(layoutModules[key].default);
    }
  }
  return layouts;
}

function getLoadingForPath(filePath) {
  const parts = filePath.split("/");
  parts.pop();
  while (parts.length >= 2) {
    const key = parts.join("/") + "/loading.tsx";
    if (loadingModules[key] && loadingModules[key].default) {
      return loadingModules[key].default;
    }
    parts.pop();
  }
  return null;
}

function wrapWithLayouts(element, layouts) {
  return layouts.reduceRight((wrapped, Layout) => {
    return createElement(Layout, null, wrapped);
  }, element);
}

function toRoutePath(filePath) {
  let p = filePath;
  p = p.replace(/[\\\\]/g, "/");
  p = p.replace(/.*[/]pages[/]/, "");
  p = p.replace(/[.]tsx$/i, "");
  p = p.replace(/[/]index$/, "");
  p = p.replace(/[(][^)]+[)][/]/g, "");
  p = p.replace(/[[]([\\w]+)[\\]]/g, ":$1");
  if (p === "index" || p === "") return "/";
  return "/" + p;
}

const pageEntries = Object.entries(pages).filter(([filePath]) => {
  if (filePath.endsWith("/layout.tsx")) return false;
  if (filePath.endsWith("/loading.tsx")) return false;
  const segments = filePath.split("/");
  return !segments.some((s) => s.startsWith("_"));
});

const routes = pageEntries.map(([filePath, component]) => {
  const routePath = toRoutePath(filePath);
  const Component = lazy(component);
  const layouts = getLayoutsForPath(filePath);
  const Loading = getLoadingForPath(filePath);

  const fallback = Loading
    ? createElement(Loading)
    : createElement("div", null, "Loading\\u2026");

  const pageElement = createElement(
    Suspense,
    { fallback },
    createElement(Component)
  );

  return {
    path: routePath,
    element: layouts.length > 0 ? wrapWithLayouts(pageElement, layouts) : pageElement,
  };
});

routes.push({
  path: "*",
  element: NotFoundComponent
    ? createElement(NotFoundComponent)
    : createElement("div", null, "404 - Page Not Found"),
});

export const router = createBrowserRouter(routes);
`;
      }
    },
  };
}