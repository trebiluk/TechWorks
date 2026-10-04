import { defineEventHandler, getHeader, setHeader, setResponseStatus, type H3Event } from "h3";

const ALLOW = new Set(["https://apps.kulibert.net", "https://tw.kulibert.net"]);

export default defineEventHandler((event: H3Event) => {
  const origin = getHeader(event, "origin") ?? "";
  let ok = ALLOW.has(origin);
  if (!ok && origin) {
    try {
      const u = new URL(origin);
      ok = (u.hostname === "localhost" || u.hostname === "127.0.0.1") && (u.protocol === "http:" || u.protocol === "https:");
    } catch {
      ok = false;
    }
  }
  if (ok) {
    setHeader(event, "access-control-allow-origin", origin);
    setHeader(event, "access-control-allow-credentials", "true");
  }
  setHeader(event, "access-control-allow-methods", "GET, POST, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, x-kn-staff, x-kn-stepup, x-tw-desk");
  setHeader(event, "cache-control", "no-store");
  setResponseStatus(event, 204);
  return "";
});
