import { defineEventHandler, getCookie, readBody, setResponseStatus } from "h3";
import { bertopiaCors, ifMatchOf, writeWorld } from "../../../bt-world";
import { WHO_COOKIE } from "../../../who-session";

export default defineEventHandler(async (event) => {
  bertopiaCors(event);
  const world = event.url.searchParams.get("world");
  const out = await writeWorld(event, world, getCookie(event, WHO_COOKIE), ifMatchOf(event), await readBody(event));
  if (out.status !== 200) setResponseStatus(event, out.status);
  return out.body;
});
