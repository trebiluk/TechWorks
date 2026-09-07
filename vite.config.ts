import { readdirSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

/** The files `src/lib/db.ts` globs — same directory, same non-recursive scope. */
function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 *
 * Vite awaiting the hook puts this on time-to-first-render, so an app with no
 * migrations — no schema to apply — skips it entirely rather than paying for a
 * PGLite instance it never queries.
 */
function stripNulHtmlPlugin(): Plugin {
  return {
    name: "techworks-strip-nul-html",
    configureServer(server) {
      const wrap = (res: import("node:http").ServerResponse) => {
        if ((res as { __nul?: boolean }).__nul) return;
        (res as { __nul?: boolean }).__nul = true;
        const write = res.write.bind(res);
        const end = res.end.bind(res);
        const clean = (chunk: unknown) => {
          if (chunk == null) return chunk;
          if (typeof chunk === "string") return chunk.replace(/\0/g, "");
          if (chunk instanceof Uint8Array) {
            if (!chunk.includes(0)) return chunk;
            return Buffer.from(chunk.filter((b) => b !== 0));
          }
          return chunk;
        };
        res.write = ((chunk: unknown, ...args: unknown[]) => write(clean(chunk) as never, ...(args as never[]))) as typeof res.write;
        res.end = ((chunk?: unknown, ...args: unknown[]) => end(clean(chunk) as never, ...(args as never[]))) as typeof res.end;
      };
      server.middlewares.use((req, res, next) => {
        wrap(res);
        next();
      });
      return () => {
        const http = server.httpServer;
        if (!http) return;
        http.on("request", (_req, res) => wrap(res));
      };
    },
  };
}

function jsonOk(res: import("node:http").ServerResponse, body: string, maxAge: number) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", `public, max-age=${maxAge}`);
  res.end(body);
}

function djiaPlugin(): Plugin {
  return {
    name: "techworks-djia-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/api/djia") {
          next();
          return;
        }
        try {
          const mod = (await server.ssrLoadModule("/src/lib/djia.ts")) as {
            pullYahoo: () => Promise<unknown>;
          };
          const quote = await mod.pullYahoo();
          jsonOk(res, JSON.stringify(quote), 90);
        } catch (err) {
          console.error("[djia]", err);
          res.statusCode = 502;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "djia unavailable" }));
        }
      });
    },
  };
}

function weatherPlugin(): Plugin {
  return {
    name: "techworks-weather-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/api/weather") {
          next();
          return;
        }
        try {
          const mod = (await server.ssrLoadModule("/src/lib/weather.ts")) as {
            pullWeather: () => Promise<unknown>;
          };
          const sky = await mod.pullWeather();
          jsonOk(res, JSON.stringify(sky), 600);
        } catch (err) {
          console.error("[weather]", err);
          res.statusCode = 502;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "weather unavailable" }));
        }
      });
    },
  };
}

function livePlugin(): Plugin {
  return {
    name: "techworks-live-export",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/api/live") {
          next();
          return;
        }
        if ((req.method ?? "GET").toUpperCase() === "GET") {
          try {
            const body = readFileSync(join(server.config.root, "public", "live.enc"), "utf8");
            res.statusCode = 200;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.end("");
          }
          return;
        }
        if ((req.method ?? "").toUpperCase() !== "POST") {
          next();
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (c) => chunks.push(c as Buffer));
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            const dest = join(server.config.root, "public", "live.enc");
            try {
              if (readFileSync(dest, "utf8") === body) {
                res.statusCode = 204;
                res.end();
                return;
              }
            } catch {
              /* missing */
            }
            mkdirSync(join(server.config.root, "public"), { recursive: true });
            writeFileSync(dest, body);
            res.statusCode = 204;
            res.end();
          } catch (err) {
            console.error("[live]", err);
            res.statusCode = 500;
            res.end("fail");
          }
        });
      });
    },
  };
}

function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Ensure Host is the public preview host so Better Auth's dynamic
          // baseURL / redirect_uri match the popup origin.
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,
    allowedHosts: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    stripNulHtmlPlugin(),
    pgliteBootstrapPlugin(),
    djiaPlugin(),
    weatherPlugin(),
    livePlugin(),
    // Before tanstackStart so /auth/popup never falls through to the SPA.
    authPopupPlugin(),
    // Dev-only /__app-env, read by scripts/check-auth-invariant.mjs.
    appEnvPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart({
      router: { autoCodeSplitting: false },
    }),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
          }),
        ]
      : []),
    viteReact(),
  ],
}));
