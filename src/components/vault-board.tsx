import { useEffect, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { saveDeskNow } from "@/lib/store";
import {
  applyVaultClub,
  deleteSnap,
  downloadAllSnaps,
  downloadDeskBackup,
  downloadRosterTemplate,
  downloadSnap,
  emptyRoster,
  isLiveWallText,
  listDeskBackups,
  listNamedSnaps,
  restoreSnap,
  snapshotNow,
  storageLabel,
  unpackVault,
  type SnapInfo,
} from "@/lib/vault";
import { loadClub } from "@/lib/club";
import { cn } from "@/lib/utils";

export function VaultBoard({
  file,
  onChange,
  onExport,
  onExportNames,
  onSave,
  onImport,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  onExport?: () => void;
  onExportNames: () => void;
  onSave?: () => void;
  onImport?: () => void;
}) {
  const [msg, setMsg] = useState("");
  const [label, setLabel] = useState("");
  const [quota, setQuota] = useState("This device");
  const [snaps, setSnaps] = useState<SnapInfo[]>([]);
  const [daily, setDaily] = useState<SnapInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [bookBusy, setBookBusy] = useState(false);

  async function refresh() {
    const [s, d, q] = await Promise.all([listNamedSnaps(), listDeskBackups(), storageLabel()]);
    setSnaps(s);
    setDaily(d);
    setQuota(q);
  }

  useEffect(() => {
    void refresh();
  }, [file.meta.savedAt, file.students.length]);

  function commit(next: EconomyFile, note: string) {
    saveDeskNow(next);
    onChange(next);
    onSave?.();
    setMsg(note);
    void refresh();
  }

  async function namedSnap(why: string) {
    setBusy(true);
    try {
      const info = await snapshotNow(file, why);
      setMsg(`Snapshot saved · ${info.label} · ${info.students} workers`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function restore(info: SnapInfo) {
    if (!window.confirm(`Restore “${info.label}” from ${new Date(info.saved).toLocaleString()}? Current desk is snapshotted first.`)) return;
    setBusy(true);
    try {
      await snapshotNow(file, "Before restore");
      const hit = await restoreSnap(info.key);
      if (!hit) {
        setMsg("Snapshot missing.");
        return;
      }
      applyVaultClub(hit.club);
      commit(hit.file, `Restored ${hit.file.students.length} workers · ${info.label}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Records · this device</h2>
        <p className="mt-1 text-sm text-muted">
          This computer is the gradebook. Google book is the year archive — one tab per class and club, full-year marks, extra columns you own. VAULT has legal names; everything else is aliases. Live pipe is still later.
        </p>
      </header>

      <ol className="grid gap-2 sm:grid-cols-4">
        <li className="tw-gadget p-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">1 · Snapshot</p>
          <p className="mt-1 text-sm text-muted">Freeze the desk on this device before you import or clear.</p>
        </li>
        <li className="tw-gadget p-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">2 · File</p>
          <p className="mt-1 text-sm text-muted">Download full backup to USB or your private Drive folder.</p>
        </li>
        <li className="tw-gadget p-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">3 · Google book</p>
          <p className="mt-1 text-sm text-muted">Year spreadsheet. Gold columns locked. Extra 1–8 are yours.</p>
        </li>
        <li className="tw-gadget p-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">4 · Import</p>
          <p className="mt-1 text-sm text-muted">CSV or paste Last, First, Period. Ids mint after add.</p>
        </li>
      </ol>

      <div className="tw-gadget p-3">
        <p className="font-display text-2xl font-semibold leading-none">{file.students.length} workers</p>
        <p className="mt-1 font-mono text-xs text-subtle">
          Last save {file.meta.savedAt ? new Date(file.meta.savedAt).toLocaleString() : "not yet"} · schema {file.meta.schema ?? "—"}
          {file.meta.clearedAt ? ` · cleared ${new Date(file.meta.clearedAt).toLocaleString()}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted">{quota}</p>
      </div>

      <div className="tw-gadget p-3">
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">Google book · 2026-27</p>
        <p className="mt-1 text-sm text-muted">
          One workbook: README, YEAR, a mini dashboard per class, study hall, club, STEM stems, skills, full-year C1D1–C8D4, LOG, MASTER, VAULT. Gold headers are locked for the desk. extra_1–extra_8 are yours — rename them. Do not share the VAULT tab.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={bookBusy}
            onClick={() => {
              setBookBusy(true);
              void import("@/lib/book-xlsx")
                .then((m) => m.downloadGoogleBook(file, loadClub()))
                .then(() => setMsg("Google book downloaded · open in Drive as a Sheet"))
                .catch(() => setMsg("Could not build the Google book."))
                .finally(() => setBookBusy(false));
            }}
            className="tw-tap min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg disabled:opacity-40"
          >
            {bookBusy ? "Building book…" : "Download Google book"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">Snapshot now</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label · First day, after import…"
            className="min-h-11 min-w-[12rem] flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void namedSnap(label || `Snapshot ${new Date().toLocaleString()}`)}
            className="tw-tap min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg"
          >
            Save snapshot
          </button>
          <button
            type="button"
            onClick={() => {
              saveDeskNow(file);
              onSave?.();
              downloadDeskBackup(file, label || "Desk backup");
              setMsg("Full backup downloaded · keep it private (names inside)");
            }}
            className="tw-tap min-h-11 rounded-md bg-fg px-3 text-sm font-semibold text-bg"
          >
            Download full backup
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">Bring data in</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="tw-tap inline-flex min-h-11 cursor-pointer items-center rounded-md bg-elevated px-3 text-sm font-semibold">
            Restore backup file
            <input
              type="file"
              accept="application/json,.json,.txt"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const text = await f.text();
                if (isLiveWallText(text)) {
                  setMsg("That’s the live wall file (no names). Use a full backup.");
                  return;
                }
                const hit = unpackVault(text);
                if (!hit) {
                  setMsg("Couldn’t read that file.");
                  return;
                }
                if (!window.confirm(`Restore ${hit.file.students.length} workers from ${f.name}? Current desk is snapshotted first.`)) return;
                await snapshotNow(file, "Before file restore");
                applyVaultClub(hit.club);
                commit(hit.file, `Restored ${hit.file.students.length} workers from ${f.name}`);
              }}
            />
          </label>
          {onImport ? (
            <button type="button" onClick={onImport} className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold">
              Import class list
            </button>
          ) : null}
          <button type="button" onClick={() => downloadRosterTemplate()} className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold">
            CSV template
          </button>
          <button
            type="button"
            onClick={() => {
              onExport?.();
              setMsg("Live wall downloaded · aliases only");
            }}
            className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
          >
            Live wall
          </button>
          <button type="button" onClick={onExportNames} className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold">
            Names vault
          </button>
          <button
            type="button"
            onClick={() => {
              void downloadAllSnaps();
              setMsg("All snapshots downloaded as one file");
            }}
            className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
          >
            Download all snapshots
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">CSV columns: Last, First, Period, IEP, 504. Paste also works on Roster.</p>
      </div>

      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">Day 0</p>
        <p className="mt-1 text-sm text-muted">Wipes workers and the ledger. Crews, bells, theme, and projects stay. A snapshot is saved first.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="tw-tap min-h-11 rounded-md bg-cleanup/30 px-3 text-sm font-semibold"
            onClick={async () => {
              if (!window.confirm(`Clear ${file.students.length} workers from this device? A snapshot is saved first.`)) return;
              await snapshotNow(file, "Before clear workers");
              commit(emptyRoster(file), "Workers cleared · snapshot kept · ready to import");
            }}
          >
            Clear workers
          </button>
        </div>
      </div>

      {msg ? <p className="text-sm text-gold">{msg}</p> : null}

      <SnapList title="Named snapshots" rows={snaps} busy={busy} onRestore={restore} onDownload={(k) => void downloadSnap(k)} onDelete={async (info) => {
        if (!window.confirm(`Delete snapshot “${info.label}”?`)) return;
        await deleteSnap(info.key);
        setMsg("Snapshot deleted");
        await refresh();
      }} />
      <SnapList title="Daily autos (last 30)" rows={daily} busy={busy} onRestore={restore} onDownload={(k) => void downloadSnap(k)} />
    </section>
  );
}

function SnapList({
  title,
  rows,
  busy,
  onRestore,
  onDownload,
  onDelete,
}: {
  title: string;
  rows: SnapInfo[];
  busy: boolean;
  onRestore: (info: SnapInfo) => void;
  onDownload: (key: string) => void;
  onDelete?: (info: SnapInfo) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">{title}</p>
      {rows.length ? (
        <ul className="mt-2 space-y-1">
          {rows.map((b) => (
            <li key={b.key} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-elevated px-3 py-2">
              <span>
                <span className="font-medium">{b.label}</span>
                <span className="ml-2 font-mono text-xs text-subtle">
                  {new Date(b.saved).toLocaleString()} · {b.students} workers
                </span>
              </span>
              <span className="flex flex-wrap gap-1">
                <button type="button" disabled={busy} onClick={() => onRestore(b)} className="tw-tap min-h-9 rounded-md px-2 text-sm font-semibold text-gold">
                  Restore
                </button>
                <button type="button" onClick={() => onDownload(b.key)} className="tw-tap min-h-9 rounded-md px-2 text-sm font-semibold">
                  File
                </button>
                {onDelete ? (
                  <button type="button" onClick={() => onDelete(b)} className={cn("tw-tap min-h-9 rounded-md px-2 text-sm font-semibold text-muted")}>
                    Delete
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-subtle">None yet. Save a snapshot before you import.</p>
      )}
    </div>
  );
}
