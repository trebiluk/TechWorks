import { defineEventHandler, getHeader, setHeader, setResponseStatus, type H3Event } from "h3";
import { getStaff } from "../../../../kn-session";
import { knAudit } from "../../../../kn-audit";
import { listStaffWorlds } from "../../../../bt-staff";

const ALLOW = new Set(["https://apps.kulibert.net", "https://tw.kulibert.net"]);

function staffCors(event: H3Event) {
  const origin = getHeader(event, "origin") ?? "";
  let ok = ALLOW.has(origin);
  if (!ok && origin) {
    try {
      const u = new URL(origin);
      ok = (u.hostname === "localhost" || u.hostname === "127.0.0.1") && (u.protocol === "http:" || u.protocol === "https:");
    } catch { ok = false; }
  }
  if (ok) {
    setHeader(event, "access-control-allow-origin", origin);
    setHeader(event, "access-control-allow-credentials", "true");
  }
  setHeader(event, "access-control-allow-methods", "GET, POST, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, x-kn-staff, x-kn-stepup, x-tw-desk");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");
}

export default defineEventHandler(async (event) => {
  staffCors(event);
  const staff = await getStaff(event);
  if (!staff) {
    setResponseStatus(event, 401);
    return { ok: false, error: "staff" };
  }
  const worlds = await listStaffWorlds(event);
  await knAudit(event, staff.id || "staff", "bt-worlds-list", "", JSON.stringify({ n: worlds.length }));
  return { ok: true, worlds };
});
