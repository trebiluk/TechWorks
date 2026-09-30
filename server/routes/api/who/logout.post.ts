import { defineEventHandler, setCookie } from "h3";
import { schoolHost, whoCors } from "../../../who-cors";
import { WHO_COOKIE } from "../../../who-session";

export default defineEventHandler((event) => {
  whoCors(event);
  const school = schoolHost(event);
  setCookie(event, WHO_COOKIE, "", {
    httpOnly: true,
    secure: school,
    sameSite: school ? "none" : "lax",
    domain: school ? ".kulibert.net" : undefined,
    path: "/",
    maxAge: 0,
  });
  return { ok: true };
});
