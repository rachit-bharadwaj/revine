const VIRTUAL_ROUTING_ID = "\0revine:routing";

const errorBoundaryComponent = `
function RevineErrorDialog() {
  const error = useRouteError();
  const [expanded, setExpanded] = React.useState(false);

  const message = error?.message || String(error) || "An unexpected error occurred.";
  const stack = error?.stack || "";
  const stackLines = stack
    .split("\\n")
    .filter((l) => l.trim().startsWith("at "))
    .slice(0, 8);

  return React.createElement(
    "div",
    { style: overlayStyle },
    React.createElement(
      "div",
      { style: dialogStyle },
      React.createElement(
        "div",
        { style: headerStyle },
        React.createElement("span", { style: iconStyle }, "✕"),
        React.createElement("span", { style: titleStyle }, "Application Error")
      ),
      React.createElement("p", { style: messageStyle }, message),
      stackLines.length > 0 &&
        React.createElement(
          "div",
          null,
          React.createElement(
            "button",
            { onClick: () => setExpanded((v) => !v), style: toggleBtnStyle },
            expanded ? "▲ Hide stack trace" : "▼ Show stack trace"
          ),
          expanded &&
            React.createElement("pre", { style: stackStyle }, stackLines.join("\\n"))
        ),
      React.createElement(
        "div",
        { style: actionsStyle },
        React.createElement(
          "button",
          { onClick: () => window.location.reload(), style: primaryBtnStyle },
          "Reload page"
        ),
        React.createElement(
          "button",
          { onClick: () => (window.location.href = "/"), style: secondaryBtnStyle },
          "Go to home"
        )
      )
    )
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
  backdropFilter: "blur(4px)", display: "flex",
  alignItems: "center", justifyContent: "center",
  zIndex: 9999, fontFamily: "ui-monospace, 'Cascadia Code', monospace",
};
const dialogStyle = {
  background: "#1a1a1a", border: "1px solid rgba(255,77,79,0.33)",
  borderRadius: "10px", padding: "28px 32px",
  maxWidth: "560px", width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  color: "#e5e5e5",
};
const headerStyle = {
  display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px",
};
const iconStyle = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: "26px", height: "26px", borderRadius: "50%",
  background: "rgba(255,77,79,0.13)", color: "#ff4d4f",
  fontSize: "13px", fontWeight: 700,
};
const titleStyle = {
  fontFamily: "system-ui, sans-serif",
  fontSize: "16px", fontWeight: 600, color: "#fff",
};
const messageStyle = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "13px", color: "#ff7875",
  background: "rgba(255,77,79,0.06)", border: "1px solid rgba(255,77,79,0.13)",
  borderRadius: "6px", padding: "10px 14px",
  marginBottom: "16px", wordBreak: "break-word", lineHeight: 1.6,
};
const toggleBtnStyle = {
  background: "none", border: "none", cursor: "pointer",
  color: "#888", fontSize: "12px", padding: "0 0 10px 0",
  fontFamily: "system-ui, sans-serif",
};
const stackStyle = {
  background: "#111", borderRadius: "6px", padding: "12px 14px",
  fontSize: "11px", color: "#aaa", overflowX: "auto",
  lineHeight: 1.7, marginBottom: "16px", border: "1px solid #2a2a2a",
  whiteSpace: "pre-wrap", wordBreak: "break-all",
};
const actionsStyle = { display: "flex", gap: "10px", marginTop: "6px" };
const primaryBtnStyle = {
  flex: 1, padding: "9px 0", borderRadius: "6px", border: "none",
  background: "#ff4d4f", color: "#fff", fontWeight: 600,
  fontSize: "13px", cursor: "pointer", fontFamily: "system-ui, sans-serif",
};
const secondaryBtnStyle = {
  flex: 1, padding: "9px 0", borderRadius: "6px",
  border: "1px solid #333", background: "transparent",
  color: "#aaa", fontSize: "13px", cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
};
`;

export function revinePlugin(): any {
  return {
    name: "revine",
    enforce: "pre",

    resolveId(id: string) {
      if (id === "revine/routing") {
        return VIRTUAL_ROUTING_ID;
      }
    },

    load(id: string) {
      if (id === VIRTUAL_ROUTING_ID) {
        return `
import { createBrowserRouter, useRouteError } from "react-router-dom";
import { lazy, Suspense, createElement } from "react";
import React from "react";

${errorBoundaryComponent}

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
  p = p.replace(/\\\\/g, "/");
  p = p.replace(/.*\\/pages\\//, "");
  p = p.replace(/\\.tsx$/i, "");
  p = p.replace(/\\([^)]+\\)\\//g, "");
  p = p.replace(/\\/index$/, "");
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
    : createElement("div", null, "Loading\u2026");

  const pageElement = createElement(
    Suspense,
    { fallback },
    createElement(Component)
  );

  return {
    path: routePath,
    element: layouts.length > 0 ? wrapWithLayouts(pageElement, layouts) : pageElement,
    errorElement: createElement(RevineErrorDialog),
  };
});

routes.push({
  path: "*",
  element: NotFoundComponent
    ? createElement(NotFoundComponent)
    : createElement("div", null, "404 - Page Not Found"),
  errorElement: createElement(RevineErrorDialog),
});

export const router = createBrowserRouter(routes);
`;
      }
    },
  };
}
