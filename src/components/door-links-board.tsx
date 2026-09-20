"use client";

import { useEffect, useState } from "react";
import { deskToken, ensureDeskKey, formatDeskKey, storedDeskKey } from "@/lib/desk-cloud";
import { cn } from "@/lib/utils";

const ICONS = ["link", "globe", "bookmark", "video", "file", "game", "music", "calc", "news", "school"] as const;
const MAX_NOTE = 80;

type LinkRow = { id: string; name: string; href: string; icon: string };

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

export function DoorLinksBoard({
  unlocked = false,
  onNeedPin,
}: {
  unlocked?: boolean;
  onNeedPin?: () => void;
}) {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [note, setNote] = useState("");
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
      const pack = (await res.json()) as {
        links?: LinkRow[];
        note?: string;
        updated?: string;
        store?: string;
      };
      setLinks(Array.isArray(pack.links) ? pack.links : []);
      setNote(typeof pack.note === "string" ? pack.note : "");
      setUpdated(pack.updated ?? "");
      const n = (pack.links ?? []).length;
      if (pack.store === "none") {
        setStatus("Door store is not bound on this host yet.");
      } else {
        setStatus(`${n} live on the Tech Room door.`);
      }
    } catch {
      setStatus("Could not reach the door feed.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(next: LinkRow[], nextNote = note) {
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
        body: JSON.stringify({ keyHash: token, links: next, note: nextNote }),
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
      const pack = (await res.json()) as {
        links?: LinkRow[];
        note?: string;
        updated?: string;
        n?: number;
      };
      setLinks(Array.isArray(pack.links) ? pack.links : next);
      setNote(typeof pack.note === "string" ? pack.note : nextNote);
      setUpdated(pack.updated ?? "");
      setStatus(`${pack.n ?? next.length} live on apps.kulibert.net. Chromebooks pick it up in about 40s.`);
    } catch {
      setStatus("Offline — try again on the shop PC.");
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...links];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    const tmp = next[index];
    next[index] = next[swap];
    next[swap] = tmp;
    void save(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
      <header className="tw-gadget p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Door · school links</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Included shortcuts</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          These tiles show on every Chromebook at apps.kulibert.net. Names and https links only — no roster.
          Kids can still add their own shortcuts on that machine.
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
          const trimmed = note.replace(/\s+/g, " ").trim().slice(0, MAX_NOTE);
          void save(links, trimmed);
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Door line</p>
        <label className="grid gap-1 text-sm font-semibold">
          One line on every Chromebook
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
            maxLength={MAX_NOTE}
            placeholder="This week: bring your sketch to period 3"
            className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none"
            autoComplete="off"
          />
        </label>
        <p className="text-xs text-muted">{note.length}/{MAX_NOTE} · no HTML</p>
        <button
          type="submit"
          disabled={busy}
          className="tw-tap min-h-11 rounded-md bg-elevated px-4 text-sm font-semibold disabled:opacity-50"
        >
          Save door line
        </button>
      </form>

      <form
        className="tw-gadget grid gap-2 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const n = name.replace(/\s+/g, " ").trim().slice(0, 24);
          const address = href.trim();
          if (!n || !address) return;
          const keyHref = hrefKey(address);
          if (links.some((item) => hrefKey(item.href) === keyHref)) {
            setStatus("Already on the door.");
            return;
          }
          const row: LinkRow = { id: newId(), name: n, href: address, icon };
          setName("");
          setHref("");
          void save([...links, row]);
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Add for the whole school</p>
        <label className="grid gap-1 text-sm font-semibold">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="NYSED"
            className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none"
            autoComplete="off"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Address
          <input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://"
            className="min-h-11 rounded-md bg-elevated px-3 font-medium outline-none"
            autoComplete="off"
            inputMode="url"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {ICONS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setIcon(id)}
              className={cn(
                "min-h-9 rounded-full px-3 text-xs font-semibold",
                icon === id ? "bg-gold text-bg" : "bg-elevated text-muted",
              )}
            >
              {id}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="tw-tap min-h-11 rounded-md bg-fg px-4 text-sm font-semibold text-bg disabled:opacity-50"
        >
          Save to the door
        </button>
      </form>

      <ul className="grid gap-2">
        {links.length === 0 ? (
          <li className="tw-gadget px-4 py-3 text-sm text-muted">No school links yet. Add NYSED, a slide deck, this week’s brief.</li>
        ) : (
          links.map((row, index) => (
            <li key={row.id} className="tw-gadget flex min-h-14 items-center justify-between gap-3 px-3">
              <a href={row.href} target="_blank" rel="noreferrer" className="min-w-0 truncate text-sm font-semibold">
                {row.name}
                <span className="ml-2 font-mono text-xs font-medium text-muted">{row.href.replace(/^https?:\/\//, "")}</span>
              </a>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold disabled:opacity-40"
                  disabled={index === 0 || busy}
                  aria-label={`Move ${row.name} up`}
                  onClick={() => move(index, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold disabled:opacity-40"
                  disabled={index === links.length - 1 || busy}
                  aria-label={`Move ${row.name} down`}
                  onClick={() => move(index, 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold text-loss"
                  onClick={() => void save(links.filter((item) => item.id !== row.id))}
                >
                  Remove
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
