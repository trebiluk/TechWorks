import { defineEventHandler, getHeader, setHeader } from "h3";
import { loadDoor } from "../../door-kv";

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", origin || "*");
  setHeader(event, "access-control-allow-methods", "GET, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk");
  setHeader(event, "access-control-max-age", "600");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "public, max-age=30, must-revalidate");
  const { pack, store } = await loadDoor(event);
  return { ...pack, store };
});
