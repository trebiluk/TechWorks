import { defineEventHandler, setResponseStatus } from "h3";
import { bertopiaCors } from "../../../bt-world";

export default defineEventHandler((event) => {
  bertopiaCors(event);
  setResponseStatus(event, 204);
  return null;
});
