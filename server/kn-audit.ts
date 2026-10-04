import { knDb } from "./cf-env";

let swept = 0;

export async function knAudit(
  event: unknown,
  actor: string,
  action: string,
  target?: string,
  detail?: string,
  undo?: string,
) {
  const db = knDb(event);
  if (!db) return;
  const now = Date.now();
  await db
    .prepare("INSERT INTO kn_audit (at, actor, action, target, detail, undo) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(now, actor.slice(0, 32), action.slice(0, 40), target?.slice(0, 40) ?? null, detail?.slice(0, 200) ?? null, undo?.slice(0, 200) ?? null)
    .run();
  if (now - swept > 24 * 60 * 60 * 1000) {
    swept = now;
    await db.prepare("DELETE FROM kn_audit WHERE at < ?").bind(now - 30 * 24 * 60 * 60 * 1000).run();
  }
}
