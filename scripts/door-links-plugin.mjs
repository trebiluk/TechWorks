import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Dev-only /api/door-links so Admin → Door works in preview without KV. */
export function doorLinksPlugin() {
  const dataPath = () => join(process.cwd(), ".data", "door-links.json");
  const lockPath = () => join(process.cwd(), ".data", "door-links-auth.txt");

  function readPack() {
    try {
      return JSON.parse(readFileSync(dataPath(), "utf8"));
    } catch {
      return { kind: "tech-room-included", updated: "", links: [] };
    }
  }

  function readLock() {
    try {
      return readFileSync(lockPath(), "utf8").trim();
    } catch {
      return "";
    }
  }

  return {
    name: "techworks-door-links",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/api/door-links") {
          next();
          return;
        }
        const method = (req.method ?? "GET").toUpperCase();
        const origin = String(req.headers.origin ?? "");
        const json = (code, body) => {
          res.statusCode = code;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.setHeader("cache-control", "no-store");
          if (origin) res.setHeader("access-control-allow-origin", origin);
          res.setHeader("access-control-allow-methods", "GET, PUT, OPTIONS");
          res.setHeader("access-control-allow-headers", "content-type, authorization, x-tw-desk");
          res.end(typeof body === "string" ? body : JSON.stringify(body));
        };
        if (method === "OPTIONS") {
          res.statusCode = 204;
          if (origin) res.setHeader("access-control-allow-origin", origin);
          res.setHeader("access-control-allow-methods", "GET, PUT, OPTIONS");
          res.setHeader("access-control-allow-headers", "content-type, authorization, x-tw-desk");
          res.setHeader("access-control-max-age", "600");
          res.end("");
          return;
        }
        if (method === "GET") {
          json(200, { ...readPack(), store: "file" });
          return;
        }
        if (method !== "PUT") {
          next();
          return;
        }
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            const auth = String(req.headers.authorization ?? "");
            const token = (
              (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "") ||
              String(req.headers["x-tw-desk"] ?? "") ||
              String(body?.keyHash ?? "")
            ).trim();
            if (!/^[a-f0-9]{64}$/i.test(token)) {
              json(401, { error: "desk key" });
              return;
            }
            const lock = readLock();
            if (lock && lock !== token) {
              json(401, { error: "desk key" });
              return;
            }
            const links = Array.isArray(body?.links) ? body.links : [];
            const pack = {
              kind: "tech-room-included",
              updated: new Date().toISOString(),
              links,
            };
            mkdirSync(join(process.cwd(), ".data"), { recursive: true });
            writeFileSync(dataPath(), JSON.stringify(pack));
            writeFileSync(lockPath(), token);
            json(200, { ok: true, store: "file", n: links.length, updated: pack.updated, links });
          } catch (err) {
            console.error("[door-links]", err);
            json(500, { error: "fail" });
          }
        });
      });
    },
  };
}
