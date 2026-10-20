import { defineEventHandler } from "h3";
import { whoCors } from "../../who-cors";

export default defineEventHandler((event) => {
  whoCors(event);
  return null;
});
