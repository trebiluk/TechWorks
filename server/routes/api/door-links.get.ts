import { defineEventHandler, getHeader, setHeader, setResponseStatus } from "h3";
import { loadDoor, packEtag } from "../../door-kv";

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", origin || "*");
  setHeader(event, "access-control-allow-methods", "GET, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk");
  setHeader(event, "access-control-max-age", "600");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "public, max-age=30, must-revalidate");
  const { pack, store } = await loadDoor(event);
  const etag = packEtag(pack);
  setHeader(event, "etag", etag);
  const inm = getHeader(event, "if-none-match") ?? "";
  if (inm && inm === etag) {
    setResponseStatus(event, 304);
    return "";
  }
  return { ...pack, store };
});
