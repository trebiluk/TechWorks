import { defineEventHandler, getHeader, readBody, setHeader } from "h3";
import { enterWho } from "../../who-kv";

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", origin.startsWith("https://") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost") ? origin || "*" : "https://apps.kulibert.net");
  setHeader(event, "access-control-allow-methods", "GET, POST, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");
  const body = (await readBody<{ alias?: unknown; code?: unknown; pin?: unknown }>(event)) ?? {};
  return enterWho(event, String(body.alias ?? ""), String(body.code ?? ""), String(body.pin ?? ""));
});
