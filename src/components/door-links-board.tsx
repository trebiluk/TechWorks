"use client";

import { useEffect, useState } from "react";
import { deskToken, ensureDeskKey, formatDeskKey, storedDeskKey } from "@/lib/desk-cloud";
import { cn } from "@/lib/utils";

const ICONS = ["link", "globe", "bookmark", "video", "file", "game", "music", "calc", "news", "school"] as const;
const MAX_NOTE = 80;
const APPS = [
  ["techworks", "TechWorks"],
  ["baboo", "Baboo"],
  ["koderized", "Koderized"],
  ["bertycad", "BertyCAD"],
  ["bertybots", "Berty's Botz"],
  ["berty-run", "Pipe Draft"],
  ["paperlab", "PaperLab"],
  ["logolab", "LogoLab"],
  ["sprocket", "Sprocket"],
  ["den", "Bearcat Den"],
  ["bistro", "Bearcat Bistro"],
  ["housekit", "HouseKit"],
  ["drift", "Drift"],
] as const;

type LinkRow = { id: string; name: string; href: string; icon: string };

type RoomState = {
  links: LinkRow[];
  note: string;
  hidden: string[];
  club: string;
  doors: string;
  lastBell: string;
  search: string;
  footer: string;
  closed: boolean;
  closedMsg: string;
  staffEdit: boolean;
  shortcuts: boolean;
  paste: boolean;
  maxCuts: number;
  welcome: string;
  period: string;
  showNote: boolean;
  recents: boolean;
  pins: boolean;
  searchOn: boolean;
  bellsOn: boolean;
  aliasOn: boolean;
  staffLane: boolean;
  hotkeys: boolean;
  categories: boolean;
  newTab: boolean;
  lockup: boolean;
  density: "roomy" | "compact";
  focus: string;
  chips: boolean;
};

const EMPTY: RoomState = {
  links: [],
  note: "",
  hidden: [],
  club: "",
  doors: "",
  lastBell: "",
  search: "",
  footer: "",
  closed: false,
  closedMsg: "",
  staffEdit: true,
  shortcuts: true,
  paste: true,
  maxCuts: 18,
  welcome: "",
  period: "",
  showNote: true,
  recents: true,
  pins: true,
  searchOn: true,
  bellsOn: true,
  aliasOn: true,
  staffLane: true,
  hotkeys: true,
  categories: true,
  newTab: true,
  lockup: true,
  density: "roomy",
  focus: "",
  chips: true,
};

function newId() {
  return `cut-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function hrefKey(href: string) {
  try {
    const url = new URL(href.includes("://") ? href : `https://${href}`);
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.protocol}//${url.host.toLowerCase()}${path}${url.search}`.toLowerCase();
  } catch {
    return href.trim().replace(/\/+$/, "").toLowerCase();
  }
}

function when(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fromPack(pack: Partial<RoomState> & { links?: LinkRow[] }): RoomState {
  return {
    ...EMPTY,
    ...pack,
    links: Array.isArray(pack.links) ? pack.links : [],
    hidden: Array.isArray(pack.hidden) ? pack.hidden : [],
    maxCuts: typeof pack.maxCuts === "number" ? pack.maxCuts : 18,
    density: pack.density === "compact" ? "compact" : "roomy",
    staffEdit: pack.staffEdit !== false,
    shortcuts: pack.shortcuts !== false,
    paste: pack.paste !== false,
    showNote: pack.showNote !== false,
    recents: pack.recents !== false,
    pins: pack.pins !== false,
    searchOn: pack.searchOn !== false,
    bellsOn: pack.bellsOn !== false,
    aliasOn: pack.aliasOn !== false,
    staffLane: pack.staffLane !== false,
    hotkeys: pack.hotkeys !== false,
    categories: pack.categories !== false,
    newTab: pack.newTab !== false,
    lockup: pack.lockup !== false,
    chips: pack.chips !== false,
    closed: pack.closed === true,
    focus: typeof pack.focus === "string" ? pack.focus : "",
  };
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function DoorLinksBoard({
  unlocked = false,
  onNeedPin,
}: {
  unlocked?: boolean;
  onNeedPin?: () => void;
}) {
  const [room, setRoom] = useState<RoomState>(EMPTY);
  const [updated, setUpdated] = useState("");
  const [status, setStatus] = useState("Loading school links…");
  const [name, setName] = useState("");
  const [href, setHref] = useState("");
  const [icon, setIcon] = useState<string>("school");
  const [busy, setBusy] = useState(false);
  const key = storedDeskKey();

  async function load() {
    try {
      const res = await fetch("/api/door-links");
      const pack = (await res.json()) as Partial<RoomState> & { updated?: string; store?: string };
      const next = fromPack(pack);
      setRoom(next);
      setUpdated(pack.updated ?? "");
      if (pack.store === "none") {
        setStatus("Door store is not bound on this host yet.");
      } else {
        setStatus(`${next.links.length} live on the Tech Room door.`);
      }
    } catch {
      setStatus("Could not reach the door feed.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(next: RoomState) {
    if (!unlocked) {
      onNeedPin?.();
      return;
    }
    setBusy(true);
    try {
      const token = await deskToken(ensureDeskKey());
      const res = await fetch("/api/door-links", {
        method: "PUT",
        headers: { "content-type": "application/json", "x-tw-desk": token },
        body: JSON.stringify({ keyHash: token, ...next }),
      });
      if (res.status === 401) {
        setStatus("Desk key did not match. Open Records → Cloud and use that same key.");
        return;
      }
      if (res.status === 503) {
        setStatus("Door store is not bound on this host yet.");
        return;
      }
      if (!res.ok) {
        setStatus(`Save failed (${res.status}).`);
        return;
      }
      const pack = (await res.json()) as Partial<RoomState> & { updated?: string; n?: number };
      const saved = fromPack(pack);
      setRoom(saved);
      setUpdated(pack.updated ?? "");
      setStatus(`${pack.n ?? saved.links.length} live on apps.kulibert.net. Chromebooks pick it up in about 40s.`);
    } catch {
      setStatus("Offline — try again on the shop PC.");
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...room.links];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    const tmp = next[index];
    next[index] = next[swap]!;
    next[swap] = tmp!;
    void save({ ...room, links: next });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
      <header className="tw-gadget p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Door · room desk</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">School wall</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Live on every Chromebook at apps.kulibert.net. Names and https only — no roster.
          Writes use the Cloud desk key on this PC. Admin PIN unlocks the pane; the key is the lock.
        </p>
        <p className="mt-2 text-sm font-semibold">{status}</p>
        {updated ? (
          <p className="mt-1 font-mono text-xs text-muted">{when(updated) || updated}</p>
        ) : null}
        {key ? (
          <p className="mt-2 font-mono text-xs text-muted">Desk key on this PC · {formatDeskKey(key)}</p>
        ) : (
          <p className="mt-2 text-xs text-muted">First save mints the Cloud desk key on this PC.</p>
        )}
      </header>

      <form
        className="tw-gadget grid gap-2 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save({ ...room, note: room.note.replace(/\s+/g, " ").trim().slice(0, MAX_NOTE) });
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Wall</p>
        <div className="flex flex-wrap gap-1">
          <button type="button" className="min-h-9 rounded-full bg-elevated px-3 text-xs font-semibold" onClick={() => setRoom({ ...room, closed: false, closedMsg: "" })}>
            Open room
          </button>
          <button type="button" className="min-h-9 rounded-full bg-elevated px-3 text-xs font-semibold" onClick={() => setRoom({ ...room, closed: true, closedMsg: "Paper day — no Chromebooks this period" })}>
            Paper day
          </button>
          <button type="button" className="min-h-9 rounded-full bg-elevated px-3 text-xs font-semibold" onClick={() => setRoom({ ...room, closed: true, closedMsg: "Sub coverage — stay on assigned apps" })}>
            Sub coverage
          </button>
        </div>
        <Check label="Doors closed" checked={room.closed} onChange={(v) => setRoom({ ...room, closed: v })} />
        {room.closed ? (
          <label className="grid gap-1 text-sm font-semibold">
            Closed message
            <input value={room.closedMsg} onChange={(e) => setRoom({ ...room, closedMsg: e.target.value.slice(0, 80) })} maxLength={80} className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
          </label>
        ) : null}
        <label className="grid gap-1 text-sm font-semibold">
          Door line
          <input value={room.note} onChange={(e) => setRoom({ ...room, note: e.target.value.slice(0, MAX_NOTE) })} maxLength={MAX_NOTE} placeholder="This week: bring your sketch to period 3" className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" autoComplete="off" />
        </label>
        <Check label="Show door line" checked={room.showNote} onChange={(v) => setRoom({ ...room, showNote: v })} />
        <label className="grid gap-1 text-sm font-semibold">
          Welcome
          <input value={room.welcome} onChange={(e) => setRoom({ ...room, welcome: e.target.value.slice(0, 60) })} maxLength={60} className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Period pin
          <input value={room.period} onChange={(e) => setRoom({ ...room, period: e.target.value.slice(0, 24) })} maxLength={24} className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Next club
          <input value={room.club} onChange={(e) => setRoom({ ...room, club: e.target.value.slice(0, 80) })} maxLength={80} className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Doors
            <input value={room.doors} onChange={(e) => setRoom({ ...room, doors: e.target.value.slice(0, 24) })} maxLength={24} placeholder="7:55a" className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Last bell
            <input value={room.lastBell} onChange={(e) => setRoom({ ...room, lastBell: e.target.value.slice(0, 24) })} maxLength={24} placeholder="2:37p" className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
          </label>
        </div>
        <button type="submit" disabled={busy} className="tw-tap min-h-11 rounded-md bg-elevated px-4 text-sm font-semibold disabled:opacity-50">
          Save wall
        </button>
      </form>

      <form
        className="tw-gadget grid gap-2 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const n = name.replace(/\s+/g, " ").trim().slice(0, 24);
          const address = href.trim();
          if (!n || !address) return;
          if (room.links.some((item) => hrefKey(item.href) === hrefKey(address))) {
            setStatus("Already on the door.");
            return;
          }
          const row: LinkRow = { id: newId(), name: n, href: address, icon };
          setName("");
          setHref("");
          void save({ ...room, links: [...room.links, row] });
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Add for the whole school</p>
        <label className="grid gap-1 text-sm font-semibold">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="NYSED" className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" autoComplete="off" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Address
          <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="https://" className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" autoComplete="off" inputMode="url" />
        </label>
        <div className="flex flex-wrap gap-1">
          {ICONS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setIcon(id)}
              className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", icon === id ? "bg-gold text-bg" : "bg-elevated text-muted")}
            >
              {id}
            </button>
          ))}
        </div>
        <button type="submit" disabled={busy} className="tw-tap min-h-11 rounded-md bg-fg px-4 text-sm font-semibold text-bg disabled:opacity-50">
          Save to the door
        </button>
      </form>

      <ul className="grid gap-2">
        {room.links.length === 0 ? (
          <li className="tw-gadget px-4 py-3 text-sm text-muted">No school links yet. Add NYSED, a slide deck, this week’s brief.</li>
        ) : (
          room.links.map((row, index) => (
            <li key={row.id} className="tw-gadget flex min-h-14 items-center justify-between gap-3 px-3">
              <a href={row.href} target="_blank" rel="noreferrer" className="min-w-0 truncate text-sm font-semibold">
                {row.name}
                <span className="ml-2 font-mono text-xs font-medium text-muted">{row.href.replace(/^https?:\/\//, "")}</span>
              </a>
              <div className="flex shrink-0 gap-1">
                <button type="button" className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold disabled:opacity-40" disabled={index === 0 || busy} aria-label={`Move ${row.name} up`} onClick={() => move(index, -1)}>
                  Up
                </button>
                <button type="button" className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold disabled:opacity-40" disabled={index === room.links.length - 1 || busy} aria-label={`Move ${row.name} down`} onClick={() => move(index, 1)}>
                  Down
                </button>
                <button type="button" className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold text-loss" onClick={() => void save({ ...room, links: room.links.filter((item) => item.id !== row.id) })}>
                  Remove
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <form
        className="tw-gadget grid gap-2 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save(room);
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Board · hide tiles</p>
        {APPS.map(([id, label]) => {
          const on = !room.hidden.includes(id);
          return (
            <div key={id} className="grid gap-1 rounded-md bg-elevated px-3 py-2">
              <Check
                label={label}
                checked={on}
                onChange={(v) =>
                  setRoom({
                    ...room,
                    hidden: v ? room.hidden.filter((item) => item !== id) : [...room.hidden, id],
                    focus: !v && room.focus === id ? "" : room.focus,
                  })
                }
              />
              <div className="flex gap-1 pb-1">
                <button
                  type="button"
                  className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", room.focus === id ? "bg-gold text-bg" : "bg-panel text-muted")}
                  onClick={() => setRoom({ ...room, focus: room.focus === id ? "" : id, hidden: room.hidden.filter((item) => item !== id) })}
                >
                  Spotlight
                </button>
                <button
                  type="button"
                  className="min-h-9 rounded-full bg-panel px-3 text-xs font-semibold text-muted"
                  onClick={() => setRoom({ ...room, focus: id, hidden: APPS.map((row) => row[0]).filter((item) => item !== id) })}
                >
                  Only this
                </button>
              </div>
            </div>
          );
        })}
        <button type="button" className="min-h-11 rounded-md bg-elevated px-4 text-sm font-semibold" onClick={() => setRoom({ ...room, hidden: [], focus: "" })}>
          Show every tile
        </button>

        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-subtle">Policy</p>
        <Check label="Personal shortcuts" checked={room.shortcuts} onChange={(v) => setRoom({ ...room, shortcuts: v })} />
        <Check label="Paste a link in search" checked={room.paste} onChange={(v) => setRoom({ ...room, paste: v })} />
        <Check label="Pin tiles" checked={room.pins} onChange={(v) => setRoom({ ...room, pins: v })} />
        <Check label="Opened here" checked={room.recents} onChange={(v) => setRoom({ ...room, recents: v })} />
        <Check label="Keys 1–9" checked={room.hotkeys} onChange={(v) => setRoom({ ...room, hotkeys: v })} />
        <Check label="Nickname field" checked={room.aliasOn} onChange={(v) => setRoom({ ...room, aliasOn: v })} />
        <Check label="Staff lane" checked={room.staffLane} onChange={(v) => setRoom({ ...room, staffLane: v })} />
        <Check label="Staff edit link" checked={room.staffEdit} onChange={(v) => setRoom({ ...room, staffEdit: v })} />
        <label className="grid gap-1 text-sm font-semibold">
          Max personal shortcuts
          <input type="number" min={1} max={18} value={room.maxCuts} onChange={(e) => setRoom({ ...room, maxCuts: Math.min(18, Math.max(1, Number(e.target.value) || 1)) })} className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
        </label>

        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-subtle">Layout</p>
        <Check label="THE TECH ROOM lockup" checked={room.lockup} onChange={(v) => setRoom({ ...room, lockup: v })} />
        <Check label="Search" checked={room.searchOn} onChange={(v) => setRoom({ ...room, searchOn: v })} />
        <Check label="Category chips" checked={room.categories} onChange={(v) => setRoom({ ...room, categories: v })} />
        <Check label="Bell strip" checked={room.bellsOn} onChange={(v) => setRoom({ ...room, bellsOn: v })} />
        <Check label="Live version chips" checked={room.chips} onChange={(v) => setRoom({ ...room, chips: v })} />
        <Check label="Open in a new tab" checked={room.newTab} onChange={(v) => setRoom({ ...room, newTab: v })} />
        <div className="flex gap-1">
          <button type="button" className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", room.density === "roomy" ? "bg-gold text-bg" : "bg-elevated text-muted")} onClick={() => setRoom({ ...room, density: "roomy" })}>
            Roomy
          </button>
          <button type="button" className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", room.density === "compact" ? "bg-gold text-bg" : "bg-elevated text-muted")} onClick={() => setRoom({ ...room, density: "compact" })}>
            Compact
          </button>
        </div>

        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-subtle">Voice</p>
        <label className="grid gap-1 text-sm font-semibold">
          Search placeholder
          <input value={room.search} onChange={(e) => setRoom({ ...room, search: e.target.value.slice(0, 40) })} maxLength={40} className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Footer
          <input value={room.footer} onChange={(e) => setRoom({ ...room, footer: e.target.value.slice(0, 80) })} maxLength={80} className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none" />
        </label>
        <button type="submit" disabled={busy} className="tw-tap min-h-11 rounded-md bg-fg px-4 text-sm font-semibold text-bg disabled:opacity-50">
          Save board + policy
        </button>
      </form>
    </div>
  );
}
