import { createError, defineEventHandler, setHeader } from "h3";
import { pullWeather } from "../../../src/lib/weather";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "public, max-age=600");
  try {
    return await pullWeather();
  } catch {
    throw createError({ statusCode: 502, statusMessage: "weather unavailable" });
  }
});
