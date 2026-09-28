import { defineEventHandler, getHeader, getQuery, setHeader } from "h3";
import { searchWho } from "../../who-kv";

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", origin || "*");
  setHeader(event, "access-control-allow-methods", "GET, POST, PUT, OPTIONS");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");
  const q = String(getQuery(event).q ?? "");
  return { ok: true, people: await searchWho(event, q) };
});
