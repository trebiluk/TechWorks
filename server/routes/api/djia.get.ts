import { createError, defineEventHandler, setHeader } from "h3";
import { pullYahoo } from "../../../src/lib/djia";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "public, max-age=90");
  try {
    return await pullYahoo();
  } catch {
    throw createError({ statusCode: 502, statusMessage: "djia unavailable" });
  }
});
