import { defineEventHandler, getHeader, setHeader } from "h3";
import { loadMarks } from "../../marks-kv";

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", origin || "*");
  setHeader(event, "access-control-allow-methods", "GET, POST, OPTIONS");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");
  const { marks, store } = await loadMarks(event);
  return { ok: true, store, marks };
});
