import { defineEventHandler, setHeader, setResponseStatus } from "h3";
import { whoCors } from "../../who-cors";

export default defineEventHandler((event) => {
  whoCors(event);
  setHeader(event, "access-control-max-age", "600");
  setResponseStatus(event, 204);
  return "";
});