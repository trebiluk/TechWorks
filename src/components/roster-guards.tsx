import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { EconomyFile, RawStudent } from "@/lib/economy";
import { publicHandle } from "@/lib/live";
import { resetStudentPin } from "@/lib/student-pin";
import { setAlias } from "@/lib/store";
import { aliasAllowed, normalizeAlias } from "@/lib/alias-bank";
import {
  archiveStudents,
  confirmMatches,
  hallList,
  leaveHall,
  moveToClass,
  purgeForever,
  recentlyRemoved,
  restorePoint,
  seatInHall,
  softRemove,
  unarchiveStudents,
  undoRemove,
} from "@/lib/roster-safety";
import { YEAR_CLASSES } from "@/lib/sections";
import { cn } from "@/lib/utils";

type Danger = {
  phrase: string;
  title: string;
  names: string[];
  confirmLabel: string;
  undo?: boolean;
  run: (file: EconomyFile) => EconomyFile;
};

export function TypedConfirm({
  title,
  names,
  phrase,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  names: string[];
  phrase: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const ready = confirmMatches(typed, phrase);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" role="presentation" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="danger-title"
        className="w-full max-w-md rounded-2xl bg-surface p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="danger-title" className="font-display text-xl font-semibold">
          {title}
        </h2>
        {names.length ? <p className="mt-2 text-sm text-muted">{names.slice(0, 6).join(", ")}{names.length > 6 ? ` · +${names.length - 6}` : ""}</p> : null}
        <p className="mt-3 text-sm">Type <span className="font-semibold">{phrase}</span> to confirm.</p>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          aria-label={`Type ${phrase}`}
          className="mt-2 min-h-11 w-full rounded-xl bg-elevated px-3 text-base outline-none"
          autoComplete="off"
        />
        <div className="mt-3 flex gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} className="tw-tap min-h-11 flex-1 rounded-xl bg-elevated text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={onConfirm}
            className="tw-tap min-h-11 flex-1 rounded-xl bg-cleanup text-sm font-semibold text-white disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HallDesk({
  file,
  onChange,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
}) {
  const [period, setPeriod] = useState(6);
  const [q, setQ] = useState("");
  const [addQ, setAddQ] = useState("");
  const seated = hallList(file, period);
  const needle = q.trim().toLowerCase();
  const shown = seated.filter((s) => !needle || s.first.toLowerCase().includes(needle));
  const addNeedle = addQ.trim().toLowerCase();
  const pool = file.students.filter((s) => {
    if (s.removedAt || s.archivedAt) return false;
    if (seated.some((h) => h.id === s.id)) return false;
    if (!addNeedle) return false;
    return s.first.toLowerCase().includes(addNeedle);
  });
  return (
    <div className="flex flex-col gap-2 p-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Study Hall</p>
      <p className="text-sm text-muted">Add someone from any class. Their home class, code, and marks stay.</p>
      <div className="flex flex-wrap gap-1" aria-label="Hall period">
        {[6, 1, 2, 3, 4, 5, 7, 8].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-bold", period === p ? "bg-fg text-bg" : "bg-elevated text-muted")}
          >
            {p === 6 ? "Hall" : `P${p}`}
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search this hall"
        aria-label="Search this hall"
        className="min-h-11 rounded-xl bg-elevated px-3 text-base outline-none"
      />
      <ul className="divide-y divide-border/40">
        {shown.map((s) => (
          <li key={s.id} className="flex items-center gap-2 py-1">
            <span className="min-w-0 flex-1 truncate font-semibold">{s.first}</span>
            <span className="text-xs text-muted">P{s.period}</span>
            <span className="font-mono text-xs text-subtle">{publicHandle(s.id)}</span>
            <button
              type="button"
              className="tw-tap min-h-11 rounded-full px-3 text-sm font-semibold text-muted"
              onClick={() => onChange(leaveHall(file, [s.id], period))}
            >
              Remove from Hall
            </button>
          </li>
        ))}
      </ul>
      {!shown.length ? <p className="text-sm text-muted">No one in this hall yet.</p> : null}
      <label className="mt-2 text-[11px] font-bold uppercase tracking-wider text-muted">Add from a class</label>
      <input
        value={addQ}
        onChange={(e) => setAddQ(e.target.value)}
        placeholder="Search an alias to add"
        aria-label="Search an alias to add"
        className="min-h-11 rounded-xl bg-elevated px-3 text-base outline-none"
      />
      <ul>
        {pool.slice(0, 8).map((s) => (
          <li key={s.id} className="flex items-center gap-2 py-1">
            <span className="min-w-0 flex-1 truncate">{s.first}</span>
            <span className="text-xs text-muted">P{s.period}</span>
            <button
              type="button"
              className="tw-tap min-h-11 rounded-full bg-fg px-3 text-sm font-semibold text-bg"
              onClick={() => onChange(seatInHall(file, [s.id], period))}
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WorkerMenu({
  file,
  student,
  onChange,
  onRemove,
}: {
  file: EconomyFile;
  student: RawStudent;
  onChange: (next: EconomyFile) => void;
  onRemove: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "rename" | "move" | "code">("menu");
  const [name, setName] = useState(student.first);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const code = publicHandle(student.id);
  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const top = r.bottom + 8 + 240 > window.innerHeight ? Math.max(8, r.top - 248) : r.bottom + 8;
      setBox({ top, left: Math.max(8, Math.min(r.right - 224, window.innerWidth - 232)) });
    }
    setMode("menu");
    setOpen(true);
  }
  return (
    <div className="relative">
      <button ref={btnRef} type="button" aria-label={`Actions for ${student.first}`} aria-expanded={open} onClick={toggle} className="tw-tap min-h-11 min-w-11 rounded-full text-lg font-bold">
        ···
      </button>
      {open && box && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed z-30 w-56 rounded-xl bg-surface p-1 shadow-xl ring-1 ring-border" style={{ top: box.top, left: box.left }}>
          {mode === "menu" ? (
            <div className="flex flex-col">
              <MenuBtn onClick={() => setMode("rename")}>Rename alias</MenuBtn>
              <MenuBtn onClick={() => setMode("move")}>Move to a class</MenuBtn>
              <MenuBtn onClick={() => setMode("code")}>Reset PIN</MenuBtn>
              <MenuBtn onClick={() => { onChange(archiveStudents(file, [student.id])); setOpen(false); }}>Archive</MenuBtn>
              <MenuBtn onClick={() => { onRemove([student.id]); setOpen(false); }}>Remove</MenuBtn>
            </div>
          ) : null}
          {mode === "rename" ? (
            <form
              className="flex flex-col gap-1 p-1"
              onSubmit={(e) => {
                e.preventDefault();
                const next = normalizeAlias(name);
                if (!aliasAllowed(next)) return;
                onChange(setAlias(file, student.id, next));
                setOpen(false);
              }}
            >
              <input value={name} onChange={(e) => setName(e.target.value)} aria-label="New alias" className="min-h-11 rounded-lg bg-elevated px-2 text-sm outline-none" />
              <button type="submit" className="tw-tap min-h-11 rounded-lg bg-fg text-sm font-semibold text-bg">Save name</button>
            </form>
          ) : null}
          {mode === "move" ? (
            <div className="flex flex-wrap gap-1 p-1">
              {[1, 2, 3, 8, 9, 10].map((p) => (
                <MenuBtn
                  key={p}
                  onClick={() => {
                    const qtr = (file.meta.quarterName || "Q1").toUpperCase();
                    const c = YEAR_CLASSES.find((x) => x.period === p && x.quarter === qtr) ?? YEAR_CLASSES.find((x) => x.period === p);
                    if (c) onChange(moveToClass(file, [student.id], c.period, c.section, c.course));
                    setOpen(false);
                  }}
                >
                  P{p}
                </MenuBtn>
              ))}
              <MenuBtn
                onClick={() => {
                  onChange(seatInHall(file, [student.id]));
                  setOpen(false);
                }}
              >
                Hall
              </MenuBtn>
            </div>
          ) : null}
          {mode === "code" ? (
            <div className="flex flex-col gap-1 p-2">
              <p className="text-sm">PIN cleared. The shop code stays the same.</p>
              <p className="font-mono text-2xl font-semibold tracking-widest">{code}</p>
              <button
                type="button"
                className="tw-tap min-h-11 rounded-lg bg-fg text-sm font-semibold text-bg"
                onClick={() => {
                  onChange(resetStudentPin(file, student.id));
                  setOpen(false);
                }}
              >
                Clear PIN and close
              </button>
            </div>
          ) : null}
        </div>,
          document.body,
        )
        : null}
    </div>
  );
}

function MenuBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="tw-tap min-h-11 w-full rounded-lg px-2 text-left text-sm font-semibold">
      {children}
    </button>
  );
}

export function DangerZone({
  file,
  className,
  ids,
  names,
  onChange,
  onUndoReady,
}: {
  file: EconomyFile;
  className: string;
  ids: string[];
  names: string[];
  onChange: (next: EconomyFile) => void;
  onUndoReady?: (before: EconomyFile) => void;
}) {
  const [danger, setDanger] = useState<Danger | null>(null);
  const [forever, setForever] = useState<RawStudent | null>(null);
  const removed = recentlyRemoved(file);
  const points = file.meta.config?.restorePoints ?? [];
  const log = file.meta.config?.rosterLog ?? [];
  const archived = file.students.filter((s) => s.archivedAt && !s.removedAt);
  return (
    <div className="rounded-xl border border-cleanup/40 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-cleanup">Danger zone</p>
      <p className="mt-1 text-sm text-muted">Wipes live here, not next to Save.</p>
      <button
        type="button"
        className="tw-tap mt-2 min-h-11 rounded-xl bg-cleanup/20 px-3 text-sm font-semibold"
        onClick={() =>
          setDanger({
            phrase: className,
            title: `This removes ${ids.length} workers from ${className}.`,
            names,
            confirmLabel: "Remove",
            undo: true,
            run: (current) => softRemove(current, ids, className),
          })
        }
      >
        Clear workers
      </button>
      {removed.length ? (
        <div className="mt-3">
          <p className="text-sm font-semibold">Recently removed</p>
          <ul>
            {removed.map((s) => (
              <li key={s.id} className="flex items-center gap-2 py-1">
                <span className="min-w-0 flex-1 truncate">{s.first}</span>
                <button type="button" className="tw-tap min-h-11 px-2 text-sm font-semibold" onClick={() => onChange(undoRemove(file, [s.id]))}>
                  Restore
                </button>
                <button type="button" className="tw-tap min-h-11 px-2 text-sm font-semibold text-cleanup" onClick={() => setForever(s)}>
                  Delete forever
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {archived.length ? (
        <ul className="mt-2">
          {archived.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <span className="flex-1 text-sm">{s.first} · archived</span>
              <button type="button" className="tw-tap min-h-11 text-sm font-semibold" onClick={() => onChange(unarchiveStudents(file, [s.id]))}>
                Put back
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3">
        <p className="text-sm font-semibold">Restore points</p>
        {!points.length ? <p className="text-sm text-muted">None yet. A wipe saves one first.</p> : null}
        <ul>
          {points.map((p) => (
            <li key={p.at} className="flex items-center gap-2 py-1 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {p.label} · {p.students.length} back · {p.students.slice(0, 4).map((s) => s.first).filter(Boolean).join(", ") || "empty"} · {new Date(p.at).toLocaleString()}
              </span>
              <button type="button" className="tw-tap min-h-11 px-2 font-semibold" onClick={() => onChange(restorePoint(file, p.at))}>
                Restore
              </button>
            </li>
          ))}
        </ul>
      </div>
      {log.length ? (
        <ul className="mt-2 text-xs text-muted">
          {log.slice(0, 8).map((row) => (
            <li key={row.at}>{new Date(row.at).toLocaleString()} · {row.action} · {row.count} · {row.detail}</li>
          ))}
        </ul>
      ) : null}
      {danger ? (
        <TypedConfirm
          title={danger.title}
          names={danger.names}
          phrase={danger.phrase}
          confirmLabel={danger.confirmLabel}
          onCancel={() => setDanger(null)}
          onConfirm={() => {
            if (danger.undo) onUndoReady?.(file);
            onChange(danger.run(file));
            setDanger(null);
          }}
        />
      ) : null}
      {forever ? (
        <TypedConfirm
          title={`Delete ${forever.first} forever.`}
          names={[forever.first]}
          phrase={forever.first}
          confirmLabel="Delete forever"
          onCancel={() => setForever(null)}
          onConfirm={() => {
            onChange(purgeForever(file, [forever.id]));
            setForever(null);
          }}
        />
      ) : null}
    </div>
  );
}
