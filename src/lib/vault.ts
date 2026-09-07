import type { EconomyFile } from "@/lib/economy";
import { cloneFile, days4 } from "@/lib/clone";
import { compactFile } from "@/lib/compact";
import { ensureProjects } from "@/lib/projects";
import { APP_VERSION } from "@/lib/version";
import { archiveDel, archiveGet, archiveKeys, archivePutMany } from "@/lib/archive";
import { todayIso } from "@/lib/calendar";

function downloadBlob(name: string, body: string, type = "application/json") {
  if (typeof document === "undefined") return;
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export const DESK_SCHEMA = 12;
export const PACK_KIND = "techworks-desk";
export const LS_KEYS = ["techworks-desk-v12", "techworks-desk-v11"] as const;
const CURRENT = "desk:current";
const BACKUP_PREFIX = "desk:backup:";
const KEEP_BACKUPS = 14;

export type DeskPack = {
  kind: typeof PACK_KIND;
  schema: number;
  app: string;
  saved: string;
  file: EconomyFile;
};

export function packDesk(file: EconomyFile): DeskPack {
  const saved = new Date().toISOString();
  return {
    kind: PACK_KIND,
    schema: DESK_SCHEMA,
    app: APP_VERSION,
    saved,
    file: {
      ...file,
      meta: { ...file.meta, schema: DESK_SCHEMA, savedAt: saved },
    },
  };
}

export function migrateDesk(file: EconomyFile): EconomyFile {
  const next = cloneFile(file);
  next.students = (next.students ?? []).map((s, i) => {
    const legalLast = (s.legalLast ?? s.last ?? "").trim() || undefined;
    const legalFirst = (s.legalFirst ?? "").trim() || undefined;
    return {
      ...s,
      days: days4(s.days),
      marks: s.marks ?? {},
      investDays: s.investDays ?? {},
      investAsk: s.investAsk ?? {},
      flags: s.flags ?? {},
      purchases: s.purchases ?? [],
      attend: s.attend ?? {},
      affect: s.affect ?? {},
      notes: s.notes ?? {},
      cleanupDays: s.cleanupDays ?? {},
      assistDays: s.assistDays ?? {},
      skills: s.skills ?? {},
      picks: s.picks ?? [],
      gradeOverrides: s.gradeOverrides ?? {},
      abDay: s.abDay ?? (s.period === 6 ? (i % 2 === 0 ? "A" : "B") : "BOTH"),
      legalLast,
      legalFirst,
      last: legalLast ?? s.last ?? "",
    };
  });
  next.meta.dayLog = next.meta.dayLog ?? {};
  next.meta.ledger = next.meta.ledger ?? [];
  next.meta.config = next.meta.config ?? {};
  if (next.meta.config) {
    next.meta.config.roleHistory = next.meta.config.roleHistory ?? [];
    next.meta.config.classGoals = (next.meta.config.classGoals ?? []).map((g) => g.toUpperCase());
    next.meta.config.activities = (next.meta.config.activities ?? []).map((a) => a.toUpperCase());
    next.meta.config.cycleGoals = {
      "5": "PRODUCTIVITY",
      "6": "IDEA STAGE",
      "7": "DESIGN STAGE",
      "8": "MODELING STAGE",
      ...(next.meta.config.cycleGoals ?? {}),
    };
  }
  next.meta.schema = DESK_SCHEMA;
  return ensureProjects(next);
}

function asFile(raw: unknown): EconomyFile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind === PACK_KIND && o.file && typeof o.file === "object") {
    const file = o.file as EconomyFile;
    if (!Array.isArray(file.students) || !file.students.length) return null;
    return migrateDesk(file);
  }
  if (Array.isArray((o as EconomyFile).students) && (o as EconomyFile).students.length) {
    return migrateDesk(o as EconomyFile);
  }
  return null;
}

export function unpackDesk(raw: unknown): EconomyFile | null {
  try {
    if (typeof raw === "string") {
      const text = raw.trim();
      if (!text) return null;
      if (text[0] !== "{" && text[0] !== "[") {
        try {
          const json = decodeURIComponent(escape(atob(text)));
          const live = JSON.parse(json) as { v?: number };
          if (live && typeof live === "object" && "students" in live && (live as { v?: number }).v) {
            return null;
          }
          return asFile(JSON.parse(json));
        } catch {
          return null;
        }
      }
      return asFile(JSON.parse(text));
    }
    return asFile(raw);
  } catch {
    return null;
  }
}

export function writeLocal(file: EconomyFile): { ok: boolean; compact: boolean } {
  if (typeof window === "undefined") return { ok: false, compact: false };
  return writePack(packDesk(file));
}

export function writePack(pack: DeskPack): { ok: boolean; compact: boolean } {
  if (typeof window === "undefined") return { ok: false, compact: false };
  const body = JSON.stringify(pack);
  try {
    window.localStorage.setItem(LS_KEYS[0], body);
    return { ok: true, compact: false };
  } catch {
    try {
      const slim = packDesk(compactFile(pack.file));
      window.localStorage.setItem(LS_KEYS[0], JSON.stringify(slim));
      return { ok: true, compact: true };
    } catch {
      return { ok: false, compact: false };
    }
  }
}

export function readLocal(): EconomyFile | null {
  if (typeof window === "undefined") return null;
  for (const key of LS_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const file = unpackDesk(raw);
      if (file) return file;
      const parsed = JSON.parse(raw) as EconomyFile;
      if (Array.isArray(parsed?.students) && parsed.students.length) return migrateDesk(parsed);
    } catch {
      /* next key */
    }
  }
  return null;
}

let pruneAt = 0;

export async function persistVault(file: EconomyFile): Promise<void> {
  await persistPack(packDesk(file));
}

export async function persistPack(pack: DeskPack): Promise<void> {
  const json = JSON.stringify(pack);
  await archivePutMany([
    [CURRENT, json],
    [`${BACKUP_PREFIX}${pack.saved.slice(0, 10)}`, json],
  ]);
  const now = Date.now();
  if (now - pruneAt < 60_000) return;
  pruneAt = now;
  const keys = await archiveKeys(BACKUP_PREFIX);
  const extra = keys.sort().reverse().slice(KEEP_BACKUPS);
  if (extra.length) await Promise.all(extra.map((k) => archiveDel(k)));
}

export async function hydrateVault(local: EconomyFile): Promise<EconomyFile> {
  const pack = await archiveGet<DeskPack>(CURRENT);
  const idb = pack ? unpackDesk(pack) : null;
  if (!idb) return local;
  const lsT = Date.parse(local.meta.savedAt || "") || 0;
  const idbT = Date.parse(idb.meta.savedAt || pack?.saved || "") || 0;
  if (idb.students.length > local.students.length) return idb;
  if (idbT >= lsT && idb.students.length >= local.students.length) return idb;
  return local;
}

export function downloadDeskBackup(file: EconomyFile) {
  const pack = packDesk(file);
  downloadBlob(`techworks-desk-${todayIso()}.json`, JSON.stringify(pack, null, 2), "application/json");
}

export async function listDeskBackups(): Promise<{ day: string; saved?: string }[]> {
  const keys = await archiveKeys(BACKUP_PREFIX);
  return keys
    .map((k) => ({ day: k.slice(BACKUP_PREFIX.length) }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

export async function restoreBackupDay(day: string): Promise<EconomyFile | null> {
  const pack = await archiveGet<DeskPack>(`${BACKUP_PREFIX}${day}`);
  return pack ? unpackDesk(pack) : null;
}

export function isLiveWallText(text: string): boolean {
  const t = text.trim();
  if (!t || t[0] === "{" || t[0] === "[") return false;
  try {
    const json = decodeURIComponent(escape(atob(t)));
    const o = JSON.parse(json) as { v?: number; students?: unknown };
    return Boolean(o && o.v && Array.isArray(o.students));
  } catch {
    return false;
  }
}
