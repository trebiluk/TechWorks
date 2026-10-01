import { getHeader, getRequestURL, setHeader, type H3Event } from "h3";

/** School doors and the local preview. Credentials require a specific origin, never *. */
export function whoAllowOrigin(origin: string): string | null {
  if (!origin) return null;
  let host = "";
  let proto = "";
  try {
    const u = new URL(origin);
    host = u.hostname;
    proto = u.protocol;
  } catch {
    return null;
  }
  const local = host === "localhost" || host === "127.0.0.1";
  const school = host === "kulibert.net" || host.endsWith(".kulibert.net");
  if (school && proto === "https:") return origin;
  if (local && (proto === "http:" || proto === "https:")) return origin;
  return null;
}

export function whoCors(event: H3Event) {
  const origin = getHeader(event, "origin") ?? "";
  const ok = whoAllowOrigin(origin);
  if (ok) {
    setHeader(event, "access-control-allow-origin", ok);
    setHeader(event, "access-control-allow-credentials", "true");
  }
  setHeader(event, "access-control-allow-methods", "GET, POST, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk, x-tw-pin");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");
}

export function schoolHost(event: H3Event): boolean {
  const host = getRequestURL(event).hostname;
  return host === "kulibert.net" || host.endsWith(".kulibert.net");
}
