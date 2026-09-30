import { defineEventHandler, setResponseStatus } from "h3";
import { whoCors } from "../../../who-cors";

export default defineEventHandler((event) => {
  whoCors(event);
  setResponseStatus(event, 204);
  return "";
});
