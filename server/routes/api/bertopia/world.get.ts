import { defineEventHandler, getCookie, setResponseStatus } from "h3";
import { bertopiaCors, readWorld } from "../../../bt-world";
import { WHO_COOKIE } from "../../../who-session";

export default defineEventHandler(async (event) => {
  bertopiaCors(event);
  const world = event.url.searchParams.get("world");
  const ckAll = event.url.searchParams.getAll("ck");
  const ck = ckAll.length > 1 ? ckAll : ckAll[0];
  const out = await readWorld(event, { world, ck }, getCookie(event, WHO_COOKIE));
  if (out.status !== 200) setResponseStatus(event, out.status);
  return out.body;
});
