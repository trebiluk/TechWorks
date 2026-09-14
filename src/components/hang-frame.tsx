"use client";

import { useState } from "react";
import type { HangItem } from "@/lib/hang";
import { hangKindLabel, hangSrc } from "@/lib/hang";
import { cn } from "@/lib/utils";

export function HangFrame({
  items,
  unlocked,
  onHang,
  onDrop,
}: {
  items: HangItem[];
  unlocked: boolean;
  onHang: (raw: string) => void;
  onDrop: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pick, setPick] = useState(0);
  const item = items[Math.min(pick, Math.max(0, items.length - 1))] ?? null;
  const src = item ? hangSrc(item) : null;

  function submit() {
    const raw = draft.trim();
    if (!raw) return;
    onHang(raw);
    setDraft("");
  }

  return (
    <section className="tw-gadget flex min-h-0 flex-col gap-2 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Hang on this hour</p>
      {unlocked ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste a Drive, Slides, Doc, YouTube, or Canva link"
            className="tw-field min-h-11 min-w-[16rem] flex-1 text-sm"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="tw-tap min-h-11 rounded-md bg-fg px-4 text-sm font-semibold text-bg">
            Hang
          </button>
        </form>
      ) : null}
      {unlocked ? (
        <p className="text-xs text-muted">Share → Anyone with the link can view. Folders open as a link, not an embed.</p>
      ) : null}
      {items.length > 1 ? (
        <div className="flex flex-wrap gap-1">
          {items.map((h, i) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setPick(i)}
              className={cn("tw-tap min-h-8 rounded-full px-3 text-xs font-semibold", i === pick ? "bg-gold text-bg" : "bg-elevated text-muted")}
            >
              {h.title || hangKindLabel(h.kind)}
            </button>
          ))}
        </div>
      ) : null}
      {item && src ? (
        <div className="relative min-h-[14rem] w-full overflow-hidden rounded-xl bg-elevated sm:min-h-[22rem]">
          <iframe
            title={item.title || hangKindLabel(item.kind)}
            src={src}
            className="absolute inset-0 h-full w-full border-0"
            allow="fullscreen; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        </div>
      ) : item ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="tw-tap flex min-h-14 items-center rounded-xl bg-elevated px-4 text-sm font-semibold text-gold"
        >
          Open {item.title || hangKindLabel(item.kind)}
        </a>
      ) : unlocked ? (
        <p className="text-sm text-muted">Paste a Drive file, Google Slides, a Doc, YouTube, or Canva.</p>
      ) : null}
      {unlocked && item ? (
        <div className="flex flex-wrap gap-2">
          <a href={item.url} target="_blank" rel="noreferrer" className="tw-tap min-h-9 rounded-full bg-elevated px-3 text-xs font-semibold">
            Open original
          </a>
          <button type="button" onClick={() => onDrop(item.id)} className="tw-tap min-h-9 rounded-full bg-elevated px-3 text-xs font-semibold text-muted">
            Take down
          </button>
        </div>
      ) : null}
    </section>
  );
}
