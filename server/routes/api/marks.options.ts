import { defineEventHandler, getHeader, setHeader, setResponseStatus } from "h3";

export default defineEventHandler((event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", origin || "*");
  setHeader(event, "access-control-allow-methods", "GET, POST, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type");
  setHeader(event, "access-control-max-age", "600");
  setResponseStatus(event, 204);
  return "";
});
