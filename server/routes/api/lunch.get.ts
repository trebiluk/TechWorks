import { createError, defineEventHandler, getQuery, setHeader } from "h3";
import { pullBistroLunch } from "../../../src/lib/lunch";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "public, max-age=600");
  const date = String(getQuery(event).date || "").slice(0, 10);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
  try {
    return await pullBistroLunch(iso);
  } catch {
    throw createError({ statusCode: 502, statusMessage: "lunch unavailable" });
  }
});
