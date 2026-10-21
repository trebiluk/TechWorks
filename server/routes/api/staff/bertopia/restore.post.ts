import { defineEventHandler, getHeader, readBody, setHeader, setResponseStatus, type H3Event } from "h3";
import { getStaff } from "../../../../kn-session";
import { knAudit } from "../../../../kn-audit";
import { restoreStaffRev } from "../../../../bt-staff";

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
  const body = await readBody(event) as { world?: string; alias_ref?: string; rev?: number; if_match?: string };
  const world = String(body.world || "");
  const aliasRef = String(body.alias_ref || "");
  const rev = Number(body.rev);
  const ifMatch = String(body.if_match || "");
  if (!world || !aliasRef || !Number.isFinite(rev)) {
    setResponseStatus(event, 400);
    return { ok: false, error: "need world, alias_ref, rev" };
  }
  const out = await restoreStaffRev(event, aliasRef, world, rev, ifMatch);
  if (out.status !== 200) setResponseStatus(event, out.status);
  await knAudit(event, staff.id || "staff", "bt-restore", world, JSON.stringify({ alias_ref: aliasRef.slice(0, 16), rev, if_match: ifMatch }));
  return out.body;
});
