import { defineEventHandler, getHeader, setHeader, setResponseStatus } from "h3";

function allowOrigin(origin: string) {
  if (!origin) return "*";
  if (
    origin.startsWith("https://") ||
    origin.startsWith("http://127.0.0.1") ||
    origin.startsWith("http://localhost")
  ) {
    return origin;
  }
  return "https://apps.kulibert.net";
}

export default defineEventHandler((event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", allowOrigin(origin));
  setHeader(event, "access-control-allow-methods", "GET, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk");
  setHeader(event, "access-control-max-age", "600");
  setHeader(event, "vary", "origin");
  setResponseStatus(event, 204);
  return "";
});
