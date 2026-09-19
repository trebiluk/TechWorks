import { defineEventHandler, getHeader, setHeader, setResponseStatus } from "h3";

const ORIGINS = new Set(["https://apps.kulibert.net", "https://tw.kulibert.net"]);

export default defineEventHandler((event) => {
  const origin = getHeader(event, "origin") ?? "";
  const allow = ORIGINS.has(origin) ? origin : "https://apps.kulibert.net";
  setHeader(event, "access-control-allow-origin", allow);
  setHeader(event, "access-control-allow-methods", "GET, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk");
  setHeader(event, "access-control-max-age", "600");
  setHeader(event, "vary", "origin");
  setResponseStatus(event, 204);
  return "";
});
