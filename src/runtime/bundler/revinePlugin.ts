const VIRTUAL_ROUTING_ID = "\0revine:routing";

const errorBoundaryComponent = `
function RevineErrorDialog() {
  const error = useRouteError();
  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const message = error?.message || String(error) || "An unexpected error occurred.";
  const stack = error?.stack || "";
  const stackLines = stack
    .split("\\n")
    .filter((l) => l.trim().startsWith("at "))
    .slice(0, 8)
    .join("\\n");

  const handleCopy = () => {
    const text = message + (stackLines ? "\\n\\n" + stackLines : "");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return React.createElement(
    "div",
    { style: overlayStyle },
    React.createElement(
      "div",
      { style: dialogStyle },

      React.createElement(
        "div",
        { style: topBarStyle },
        React.createElement(
          "div",
          { style: brandStyle },
          React.createElement(
            "svg",
            { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none",
              stroke: "#a78bfa", strokeWidth: "2.2", strokeLinecap: "round",
              strokeLinejoin: "round", style: { flexShrink: 0 } },
            React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })
          ),
          React.createElement("span", { style: brandNameStyle }, "Revine")
        ),
        React.createElement("span", { style: badgeStyle }, "Runtime Error")
      ),

      React.createElement("div", { style: dividerStyle }),

      React.createElement(
        "div",
        { style: headerStyle },
        React.createElement(
          "div",
          { style: iconWrapStyle },
          React.createElement(
            "svg",
            { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none",
              stroke: "#f87171", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
            React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
            React.createElement("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
          )
        ),
        React.createElement("span", { style: titleStyle }, "Application Error")
      ),

      React.createElement(
        "div",
        { style: messagePanelStyle },
        React.createElement("p", { style: messageStyle }, message),
        React.createElement(
          "button",
          { onClick: handleCopy, style: copyBtnStyle, title: "Copy error" },
          copied
            ? React.createElement(
                "svg",
                { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none",
                  stroke: "#4ade80", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("polyline", { points: "20 6 9 17 4 12" })
              )
            : React.createElement(
                "svg",
                { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none",
                  stroke: "#888", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
                React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
              )
        )
      ),

      stackLines.length > 0 &&
        React.createElement(
          "div",
          { style: stackSectionStyle },
          React.createElement(
            "button",
            { onClick: () => setExpanded((v) => !v), style: toggleBtnStyle },
            React.createElement(
              "svg",
              { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none",
                stroke: "#666", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round",
                style: { transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                         transition: "transform 200ms ease", flexShrink: 0 } },
              React.createElement("polyline", { points: "9 18 15 12 9 6" })
            ),
            React.createElement("span", null, "Stack trace")
          ),
          expanded &&
            React.createElement("pre", { style: stackStyle }, stackLines)
        ),

      React.createElement(
        "div",
        { style: actionsStyle },
        React.createElement(
          "button",
          { onClick: () => window.location.reload(), style: primaryBtnStyle },
          React.createElement(
            "svg",
            { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none",
              stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("polyline", { points: "23 4 23 10 17 10" }),
            React.createElement("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })
          ),
          "Reload page"
        ),
        React.createElement(
          "button",
          { onClick: () => (window.location.href = "/"), style: secondaryBtnStyle },
          React.createElement(
            "svg",
            { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none",
              stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
            React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })
          ),
          "Go to home"
        )
      )
    )
  );
}

const overlayStyle = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.72)",
  backdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999,
};
const dialogStyle = {
  background: "#141414",
  border: "1px solid #2a2a2a",
  borderRadius: "14px",
  padding: "0",
  maxWidth: "580px", width: "92%",
  boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
  color: "#e5e5e5",
  overflow: "hidden",
  fontFamily: "system-ui, -apple-system, sans-serif",
};
const topBarStyle = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "12px 18px", background: "#0e0e0e",
};
const brandStyle = { display: "flex", alignItems: "center", gap: "7px" };
const brandNameStyle = {
  fontSize: "13px", fontWeight: 700,
  color: "#c4b5fd", letterSpacing: "0.04em",
  fontFamily: "system-ui, sans-serif",
};
const badgeStyle = {
  fontSize: "11px", fontWeight: 600, color: "#f87171",
  background: "rgba(248,113,113,0.1)",
  border: "1px solid rgba(248,113,113,0.2)",
  borderRadius: "999px", padding: "2px 10px", letterSpacing: "0.03em",
};
const dividerStyle = { height: "1px", background: "#1f1f1f" };
const headerStyle = {
  display: "flex", alignItems: "center", gap: "10px",
  padding: "20px 22px 0 22px",
};
const iconWrapStyle = {
  width: "28px", height: "28px", borderRadius: "8px",
  background: "rgba(248,113,113,0.1)",
  border: "1px solid rgba(248,113,113,0.15)",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const titleStyle = { fontSize: "15px", fontWeight: 650, color: "#fff", letterSpacing: "-0.01em" };
const messagePanelStyle = {
  position: "relative", margin: "14px 22px 0 22px",
  background: "rgba(248,113,113,0.05)",
  border: "1px solid rgba(248,113,113,0.12)",
  borderRadius: "8px", padding: "12px 40px 12px 14px",
};
const messageStyle = {
  fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
  fontSize: "12.5px", color: "#fca5a5",
  margin: 0, lineHeight: 1.65, wordBreak: "break-word",
};
const copyBtnStyle = {
  position: "absolute", top: "10px", right: "10px",
  background: "rgba(255,255,255,0.05)", border: "1px solid #2e2e2e",
  borderRadius: "6px", width: "28px", height: "28px",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", transition: "background 150ms ease", flexShrink: 0,
};
const stackSectionStyle = { margin: "14px 22px 0 22px" };
const toggleBtnStyle = {
  background: "none", border: "none", cursor: "pointer",
  color: "#666", fontSize: "12px", padding: "4px 0",
  display: "flex", alignItems: "center", gap: "6px",
  letterSpacing: "0.02em", transition: "color 150ms ease",
};
const stackStyle = {
  background: "#0a0a0a", border: "1px solid #222", borderRadius: "8px",
  padding: "14px 16px", fontSize: "11px", color: "#888",
  overflowX: "auto", lineHeight: 1.8, marginTop: "8px", marginBottom: 0,
  whiteSpace: "pre-wrap", wordBreak: "break-all",
  fontFamily: "ui-monospace, 'Cascadia Code', monospace",
};
const actionsStyle = {
  display: "flex", gap: "10px", padding: "18px 22px 22px 22px", marginTop: "16px",
};
const primaryBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: "8px", border: "none",
  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
  color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  letterSpacing: "0.01em", boxShadow: "0 2px 12px rgba(124,58,237,0.35)",
  fontFamily: "system-ui, sans-serif",
};
const secondaryBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: "8px",
  border: "1px solid #2e2e2e", background: "rgba(255,255,255,0.03)",
  color: "#999", fontSize: "13px", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  letterSpacing: "0.01em", fontFamily: "system-ui, sans-serif",
};
`;

// ── Shared overlay HTML builder (used in both the inline script and module error handler)
// Written as a plain JS string so it can be embedded inside the injected <script> tag.
const overlayScriptContent = `
(function () {
  function showOverlay(title, message, detail) {
    if (document.getElementById('__revine_error_overlay__')) return;

    var overlay = document.createElement('div');
    overlay.id = '__revine_error_overlay__';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif';

    var inner = document.createElement('div');
    inner.style.cssText = 'background:#141414;border:1px solid #2a2a2a;border-radius:14px;max-width:580px;width:92%;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.7)';

    // Top bar
    var topBar = document.createElement('div');
    topBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:#0e0e0e';
    topBar.innerHTML = '<div style="display:flex;align-items:center;gap:7px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span style="font-size:13px;font-weight:700;color:#c4b5fd;letter-spacing:0.04em">Revine</span></div><span style="font-size:11px;font-weight:600;color:#f87171;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.2);border-radius:999px;padding:2px 10px">' + title + '</span>';

    // Divider
    var divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:#1f1f1f';

    // Body
    var body = document.createElement('div');
    body.style.cssText = 'padding:20px 22px 0';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:14px';
    header.innerHTML = '<div style="width:28px;height:28px;border-radius:8px;flex-shrink:0;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.15);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><span style="font-size:15px;font-weight:600;color:#fff">' + message + '</span>';

    // Message panel with copy button
    var msgPanel = document.createElement('div');
    msgPanel.style.cssText = 'position:relative;background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.12);border-radius:8px;padding:12px 44px 12px 14px;margin-bottom:14px';

    var pre = document.createElement('pre');
    pre.id = '__revine_err_detail__';
    pre.style.cssText = 'font-family:ui-monospace,monospace;font-size:12px;color:#fca5a5;margin:0;line-height:1.65;white-space:pre-wrap;word-break:break-all';
    pre.textContent = detail;

    var copyBtn = document.createElement('button');
    copyBtn.textContent = '⎘';
    copyBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.05);border:1px solid #2e2e2e;border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#888;font-size:13px';
    copyBtn.onclick = function() {
      navigator.clipboard.writeText(pre.textContent || '').then(function() {
        copyBtn.textContent = '✓';
        setTimeout(function() { copyBtn.textContent = '⎘'; }, 2000);
      });
    };

    msgPanel.appendChild(pre);
    msgPanel.appendChild(copyBtn);
    body.appendChild(header);
    body.appendChild(msgPanel);

    // Actions
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;padding:4px 22px 22px';

    var reloadBtn = document.createElement('button');
    reloadBtn.textContent = 'Reload page';
    reloadBtn.style.cssText = 'flex:1;padding:10px 0;border-radius:8px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:600;font-size:13px;cursor:pointer;box-shadow:0 2px 12px rgba(124,58,237,0.35)';
    reloadBtn.onclick = function() { window.location.reload(); };

    var dismissBtn = document.createElement('button');
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.style.cssText = 'flex:1;padding:10px 0;border-radius:8px;border:1px solid #2e2e2e;background:rgba(255,255,255,0.03);color:#999;font-size:13px;cursor:pointer';
    dismissBtn.onclick = function() { overlay.remove(); };

    actions.appendChild(reloadBtn);
    actions.appendChild(dismissBtn);

    inner.appendChild(topBar);
    inner.appendChild(divider);
    inner.appendChild(body);
    inner.appendChild(actions);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
  }

  // Expose globally so the module onerror attribute can call it
  window.__revineShowOverlay = showOverlay;

  // Catches runtime JS errors and async rejections
  window.addEventListener('error', function(e) {
    // Ignore errors that already have an overlay
    if (document.getElementById('__revine_error_overlay__')) return;
    var msg = e.message || 'Unknown error';
    var src = e.filename ? e.filename.replace(location.origin, '') : '';
    var detail = src ? msg + '\\n\\nSource: ' + src + (e.lineno ? ':' + e.lineno : '') : msg;
    showOverlay('Module Error', 'Failed to load module', detail);
  });

  window.addEventListener('unhandledrejection', function(e) {
    if (document.getElementById('__revine_error_overlay__')) return;
    var reason = e.reason;
    var msg = (reason && reason.message) ? reason.message : String(reason || 'Unhandled Promise rejection');
    var detail = (reason && reason.stack) ? reason.stack : msg;
    showOverlay('Unhandled Rejection', 'Promise rejected', detail);
  });
})();
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

    transformIndexHtml(html: string) {
      // 1. Inject the overlay listener script into <head>
      let result = html.replace(
        "</head>",
        `<script>${overlayScriptContent}</script></head>`,
      );

      // 2. Find the main module entry <script> tag and attach an onerror handler.
      //    This is the ONLY way to catch ES module link-time errors like
      //    "does not provide an export named 'X'" — window.onerror does NOT fire for these.
      result = result.replace(
        /(<script\s[^>]*type=["']module["'][^>]*src=["'][^"']+["'][^>]*)(\/?>)/g,
        (_match: string, opening: string, closing: string) =>
          opening +
          ` onerror="window.__revineShowOverlay && window.__revineShowOverlay('Module Error','Failed to load application',event.type+': A module failed to load. Check all imports are valid and run \\'npm run build\\' in the Revine package.')"` +
          closing,
      );

      return result;
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