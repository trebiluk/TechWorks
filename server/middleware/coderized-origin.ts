/**
 * Coderized on the live desk.
 * Path /coderized → PWA. Host coderized.kulibert.net → same PWA at /.
 */
import html from "../../public/coderized/index.html?raw";
import css from "../../public/coderized/styles.css?raw";
import js from "../../public/coderized/app.js?raw";
import origin from "../../public/coderized/origin.js?raw";
import manifest from "../../public/coderized/manifest.json?raw";
import sw from "../../public/coderized/sw.js?raw";
import icon from "../../public/coderized/icon.svg?raw";

const ORIGIN_HOST = "coderized.kulibert.net";

const ASSETS: Record<string, { body: string; type: string }> = {
  "/": { body: html, type: "text/html; charset=utf-8" },
  "/index.html": { body: html, type: "text/html; charset=utf-8" },
  "/styles.css": { body: css, type: "text/css; charset=utf-8" },
  "/app.js": { body: js, type: "text/javascript; charset=utf-8" },
  "/origin.js": { body: origin, type: "text/javascript; charset=utf-8" },
  "/manifest.json": { body: manifest, type: "application/manifest+json; charset=utf-8" },
  "/sw.js": { body: sw, type: "text/javascript; charset=utf-8" },
  "/icon.svg": { body: icon, type: "image/svg+xml" },
};

interface EventLike {
  url: URL;
  req: { method: string; headers: Headers };
}

function hostOf(event: EventLike): string {
  const raw =
    event.req.headers.get("x-forwarded-host") ?? event.req.headers.get("host") ?? event.url.host;
  return String(raw).split(",")[0].trim().split(":")[0].toLowerCase();
}

function lookup(host: string, path: string): { body: string; type: string } | null {
  if (host === ORIGIN_HOST) {
    const key = path === "" || path === "/" ? "/" : path;
    return ASSETS[key] ?? ASSETS["/"];
  }
  if (path === "/coderized" || path === "/coderized/") return ASSETS["/"];
  if (path.startsWith("/coderized/")) {
    const rest = path.slice("/coderized".length);
    return ASSETS[rest] ?? null;
  }
  return null;
}

export default function coderizedOriginMiddleware(
  event: EventLike,
  next: () => unknown | Promise<unknown>,
): unknown | Promise<unknown> {
  const method = (event.req.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return next();
  const asset = lookup(hostOf(event), event.url.pathname);
  if (!asset) return next();
  return new Response(method === "HEAD" ? null : asset.body, {
    headers: {
      "content-type": asset.type,
      "cache-control": "no-cache, must-revalidate",
      "x-coderized-origin": ORIGIN_HOST,
    },
  });
}
