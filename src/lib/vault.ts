import type { EconomyFile } from "@/lib/economy";
import { cloneFile, days4 } from "@/lib/clone";
import { compactFile } from "@/lib/compact";
import { ensureProjects } from "@/lib/projects";
import { ensureSections } from "@/lib/sections";
import { APP_VERSION } from "@/lib/version";
import { archiveDel, archiveGet, archiveKeys, archivePut, archivePutMany } from "@/lib/archive";
import { todayIso } from "@/lib/calendar";
import { ensureStudentIds } from "@/lib/ids";
import { loadClub, saveClub, type ClubFile } from "@/lib/club";
import { emptyRoster, pickDesk } from "@/lib/vault-core";

export { emptyRoster, pickDesk };

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
export const VAULT_KIND = "techworks-vault";
export const LS_KEYS = ["techworks-desk-v12", "techworks-desk-v11"] as const;
const CURRENT = "desk:current";
const BACKUP_PREFIX = "desk:backup:";
const SNAP_PREFIX = "desk:snap:";
const KEEP_DAILY = 30;
const KEEP_SNAPS = 80;

export type DeskPack = {
  kind: typeof PACK_KIND;
  schema: number;
  app: string;
  saved: string;
  file: EconomyFile;
};

export type VaultBundle = {
  kind: typeof VAULT_KIND;
  v: 1;
  app: string;
  saved: string;
  label?: string;
  students: number;
  desk: DeskPack;
  club?: ClubFile;
};

export type SnapInfo = {
  key: string;
  saved: string;
  label: string;
  students: number;
  app: string;
  daily?: boolean;
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

export function packVault(file: EconomyFile, label = "Snapshot"): VaultBundle {
  const desk = packDesk(file);
  return {
    kind: VAULT_KIND,
    v: 1,
    app: APP_VERSION,
    saved: desk.saved,
    label: label.trim().slice(0, 80) || "Snapshot",
    students: file.students.length,
    desk,
    club: typeof window === "undefined" ? undefined : loadClub(),
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
      prints: s.prints ?? {},
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
  next.students = ensureStudentIds(next.students);
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
  return ensureSections(ensureProjects(next));
}

function asFile(raw: unknown): EconomyFile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind === VAULT_KIND && o.desk && typeof o.desk === "object") {
    return asFile(o.desk);
  }
  if (o.kind === PACK_KIND && o.file && typeof o.file === "object") {
    const file = o.file as EconomyFile;
    if (!Array.isArray(file.students)) return null;
    return migrateDesk(file);
  }
  if (Array.isArray((o as EconomyFile).students)) {
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

export function unpackVault(raw: unknown): { file: EconomyFile; club?: ClubFile; label?: string } | null {
  try {
    const o = typeof raw === "string" ? (JSON.parse(raw) as Record<string, unknown>) : (raw as Record<string, unknown>);
    if (!o || typeof o !== "object") return null;
    if (o.kind === VAULT_KIND) {
      const file = asFile(o.desk);
      if (!file) return null;
      return {
        file,
        club: o.club && typeof o.club === "object" ? (o.club as ClubFile) : undefined,
        label: typeof o.label === "string" ? o.label : undefined,
      };
    }
    const file = asFile(o);
    return file ? { file } : null;
  } catch {
    return null;
  }
}

export function applyVaultClub(club?: ClubFile) {
  if (!club) return;
  saveClub(club);
}

export function writeLocal(file: EconomyFile): { ok: boolean; compact: boolean } {
  if (typeof window === "undefined") return { ok: false, compact: false };
  return writePack(packDesk(file));
}

export function writePack(pack: DeskPack, body = JSON.stringify(pack)): { ok: boolean; compact: boolean } {
  if (typeof window === "undefined") return { ok: false, compact: false };
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
      if (Array.isArray(parsed?.students)) return migrateDesk(parsed);
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

export async function persistPack(pack: DeskPack, json = JSON.stringify(pack)): Promise<void> {
  await archivePutMany([
    [CURRENT, json],
    [`${BACKUP_PREFIX}${pack.saved.slice(0, 10)}`, json],
  ]);
  const now = Date.now();
  if (now - pruneAt < 60_000) return;
  pruneAt = now;
  const keys = await archiveKeys(BACKUP_PREFIX);
  const extra = keys.sort().reverse().slice(KEEP_DAILY);
  if (extra.length) await Promise.all(extra.map((k) => archiveDel(k)));
  const snaps = await archiveKeys(SNAP_PREFIX);
  const snapExtra = snaps.sort().reverse().slice(KEEP_SNAPS);
  if (snapExtra.length) await Promise.all(snapExtra.map((k) => archiveDel(k)));
}

export async function hydrateVault(local: EconomyFile): Promise<EconomyFile> {
  const pack = await archiveGet<DeskPack | VaultBundle>(CURRENT);
  const idb = pack ? unpackDesk(pack) : null;
  return pickDesk(local, idb);
}

export function downloadDeskBackup(file: EconomyFile, label?: string) {
  const bundle = packVault(file, label || "Desk backup");
  const day = todayIso();
  downloadBlob(`techworks-full-${day}.json`, JSON.stringify(bundle, null, 2), "application/json");
}

export function downloadRosterTemplate() {
  const body = "Last,First,Period,IEP,504\nSmith,Jordan,1,,\n";
  downloadBlob("techworks-roster-template.csv", body, "text/csv");
}

export async function snapshotNow(file: EconomyFile, label: string): Promise<SnapInfo> {
  const bundle = packVault(file, label);
  const key = `${SNAP_PREFIX}${bundle.saved}`;
  await archivePut(key, bundle);
  return { key, saved: bundle.saved, label: bundle.label || "Snapshot", students: bundle.students, app: bundle.app };
}

export async function listNamedSnaps(): Promise<SnapInfo[]> {
  const keys = await archiveKeys(SNAP_PREFIX);
  const out: SnapInfo[] = [];
  for (const key of keys.sort().reverse()) {
    const raw = await archiveGet<VaultBundle | DeskPack>(key);
    if (!raw) continue;
    if ("kind" in raw && raw.kind === VAULT_KIND) {
      out.push({
        key,
        saved: raw.saved,
        label: raw.label || "Snapshot",
        students: raw.students ?? raw.desk?.file?.students?.length ?? 0,
        app: raw.app,
      });
      continue;
    }
    const file = unpackDesk(raw);
    out.push({
      key,
      saved: (raw as DeskPack).saved || file?.meta.savedAt || key.slice(SNAP_PREFIX.length),
      label: "Snapshot",
      students: file?.students.length ?? 0,
      app: (raw as DeskPack).app || "",
    });
  }
  return out;
}

export async function listDeskBackups(): Promise<SnapInfo[]> {
  const keys = await archiveKeys(BACKUP_PREFIX);
  const out: SnapInfo[] = [];
  for (const key of keys.sort().reverse()) {
    const raw = await archiveGet<DeskPack>(key);
    const file = raw ? unpackDesk(raw) : null;
    out.push({
      key,
      saved: raw?.saved || key.slice(BACKUP_PREFIX.length),
      label: "Daily auto",
      students: file?.students.length ?? 0,
      app: raw?.app || "",
      daily: true,
    });
  }
  return out;
}

export async function restoreSnap(key: string): Promise<{ file: EconomyFile; club?: ClubFile } | null> {
  const raw = await archiveGet<VaultBundle | DeskPack>(key);
  if (!raw) return null;
  const parsed = unpackVault(raw);
  return parsed;
}

export async function deleteSnap(key: string): Promise<void> {
  if (!key.startsWith(SNAP_PREFIX) && !key.startsWith(BACKUP_PREFIX)) return;
  await archiveDel(key);
}

export async function downloadSnap(key: string) {
  const raw = await archiveGet<VaultBundle | DeskPack>(key);
  if (!raw) return;
  const name = key.replace(/[^\w.-]+/g, "-");
  downloadBlob(`${name}.json`, JSON.stringify(raw, null, 2), "application/json");
}

export async function downloadAllSnaps() {
  const named = await archiveKeys(SNAP_PREFIX);
  const daily = await archiveKeys(BACKUP_PREFIX);
  const snaps: unknown[] = [];
  for (const key of [...named, ...daily]) {
    const raw = await archiveGet(key);
    if (raw) snaps.push({ key, raw });
  }
  const current = await archiveGet(CURRENT);
  downloadBlob(
    `techworks-vault-bundle-${todayIso()}.json`,
    JSON.stringify({ kind: "techworks-vault-bundle", v: 1, app: APP_VERSION, saved: new Date().toISOString(), current, snaps }, null, 2),
    "application/json",
  );
}

export async function restoreBackupDay(day: string): Promise<EconomyFile | null> {
  const hit = await restoreSnap(`${BACKUP_PREFIX}${day}`);
  return hit?.file ?? null;
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

export async function storageLabel(): Promise<string> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est?.quota) return "This device";
    const used = Math.round((est.usage || 0) / 1_000_000);
    const cap = Math.round(est.quota / 1_000_000);
    return `${used} MB of ${cap} MB on this device`;
  } catch {
    return "This device";
  }
}
