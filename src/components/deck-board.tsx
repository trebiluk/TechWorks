"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Copy, Download, Maximize2, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Berty } from "@/components/berty";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { DECK, type DeckCard, type DeckKind, type DeckSlide } from "@/data/deck";
import { blankSlide, cloneDeck, copyDeckToQuarter, DECK_QUARTERS, downloadDeck, hasQuarterDeck, liveDeckQuarter, loadDeck, loadQuarterDeck, resetDeck, saveDeck, saveQuarterDeck, sanitizeSlide, setLiveDeckQuarter, type DeckQuarter } from "@/lib/deck-store";
import { quarterNow, todayIso } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const FILE = "/TechWorks-Deck.pptx";
const KINDS: DeckKind[] = ["title", "cards", "steps", "ladder", "letters", "now", "blank", "close"];

function Field({
  value,
  onChange,
  editing,
  className,
  style,
  multiline,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
  placeholder?: string;
}) {
  if (!editing) {
    if (!value) return null;
    const Tag = multiline ? "p" : "span";
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }
  const box = cn(
    className,
    "w-full rounded-md bg-white/5 ring-1 ring-[#2ee6ff]/40 outline-none placeholder:text-white/30",
  );
  if (multiline) {
    return (
      <textarea
        value={value}
        placeholder={placeholder}
        rows={2}
        className={cn(box, "resize-none")}
        style={style}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      value={value}
      placeholder={placeholder}
      className={box}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Stage({
  slide,
  editing,
  onPatch,
}: {
  slide: DeckSlide;
  editing: boolean;
  onPatch: (next: Partial<DeckSlide>) => void;
}) {
  const cards = slide.cards ?? [];
  function patchCard(i: number, next: Partial<DeckCard>) {
    const list = cards.map((c, n) => (n === i ? { ...c, ...next } : c));
    onPatch({ cards: list });
  }
  const berty = slide.berty;
  return (
    <article
      className="relative flex h-full w-full flex-col overflow-hidden text-[#f7f9ff]"
      style={{
        background: "linear-gradient(160deg, #050816 0%, #06122B 55%, #14102a 100%)",
        fontFamily: '"Outfit", "Segoe UI", sans-serif',
      }}
    >
      <span className="absolute inset-y-0 left-0 w-2.5 bg-[#8b6cff]" aria-hidden />
      <span className="absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] bg-[#1E4BAF]/40" aria-hidden />
      <header className="flex items-start justify-between gap-4 px-10 pt-7 pl-12">
        <img src="/brand/techworks.png" alt="TechWorks" className="h-9 w-auto" draggable={false} />
        <Field
          editing={editing}
          value={slide.kicker ?? ""}
          placeholder="Kicker"
          className="max-w-sm text-right font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0d48a]"
          onChange={(kicker) => onPatch({ kicker })}
        />
      </header>

      {slide.kind === "title" || slide.kind === "close" ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center px-12 pb-10">
          <Field
            editing={editing}
            value={slide.title}
            placeholder="Title"
            className={cn(
              "font-black uppercase leading-[0.9] tracking-tight text-[#2ee6ff]",
              slide.kind === "title" ? "text-[clamp(2.4rem,8vw,6.4rem)]" : "text-[clamp(2rem,5vw,4.2rem)] normal-case tracking-tight",
            )}
            style={slide.kind === "close" ? { color: "#f7f9ff" } : undefined}
            onChange={(title) => onPatch({ title })}
          />
          <Field
            editing={editing}
            value={slide.line ?? ""}
            placeholder="Line"
            multiline
            className="mt-5 max-w-3xl text-2xl font-medium text-[#b7c4ea]"
            onChange={(line) => onPatch({ line })}
          />
          <Field
            editing={editing}
            value={slide.note ?? ""}
            placeholder="Note"
            className="mt-4 font-mono text-sm uppercase tracking-[0.16em] text-[#f0d48a]"
            onChange={(note) => onPatch({ note })}
          />
        </div>
      ) : null}

      {slide.kind === "cards" || slide.kind === "blank" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <Field
            editing={editing}
            value={slide.title}
            placeholder="Title"
            className="text-5xl font-bold tracking-tight"
            onChange={(title) => onPatch({ title })}
          />
          <ul className="mt-6 grid min-h-0 flex-1 grid-cols-2 gap-3">
            {cards.map((c, n) => (
              <li key={n} className="flex flex-col justify-center rounded-2xl bg-[#141c42] px-6 py-5 ring-1 ring-white/10">
                <Field
                  editing={editing}
                  value={c.title}
                  placeholder="Card"
                  className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0d48a]"
                  onChange={(title) => patchCard(n, { title })}
                />
                <Field
                  editing={editing}
                  value={c.line}
                  placeholder="Line"
                  multiline
                  className="mt-2 text-xl leading-snug text-[#f7f9ff]"
                  onChange={(line) => patchCard(n, { line })}
                />
              </li>
            ))}
          </ul>
          <Field
            editing={editing}
            value={slide.note ?? ""}
            placeholder="Note"
            className="mt-4 text-sm text-[#b7c4ea]"
            onChange={(note) => onPatch({ note })}
          />
        </div>
      ) : null}

      {slide.kind === "steps" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <Field
            editing={editing}
            value={slide.title}
            className="text-5xl font-bold tracking-tight"
            onChange={(title) => onPatch({ title })}
          />
          <ol className="mt-6 grid min-h-0 flex-1 grid-cols-4 gap-3">
            {cards.map((c, n) => (
              <li key={n} className="flex flex-col rounded-2xl bg-[#141c42] px-5 py-6 ring-1 ring-white/10">
                <Field
                  editing={editing}
                  value={c.n ?? String(n + 1)}
                  className="font-mono text-4xl font-bold text-[#8b6cff]"
                  onChange={(nn) => patchCard(n, { n: nn })}
                />
                <Field
                  editing={editing}
                  value={c.title}
                  className="mt-4 font-mono text-sm font-bold uppercase tracking-[0.16em] text-[#2ee6ff]"
                  onChange={(title) => patchCard(n, { title })}
                />
                <Field
                  editing={editing}
                  value={c.line}
                  multiline
                  className="mt-2 text-lg leading-snug"
                  onChange={(line) => patchCard(n, { line })}
                />
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {slide.kind === "ladder" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <Field
            editing={editing}
            value={slide.title}
            className="text-5xl font-bold tracking-tight"
            onChange={(title) => onPatch({ title })}
          />
          <ol className="mt-6 grid min-h-0 flex-1 grid-cols-4 gap-3">
            {cards.map((c, n) => (
              <li
                key={n}
                className={cn(
                  "flex flex-col rounded-2xl px-5 py-6 ring-1",
                  c.n === "3" ? "bg-[#1E4BAF] ring-[#2ee6ff]" : "bg-[#141c42] ring-white/10",
                )}
              >
                <Field
                  editing={editing}
                  value={c.n ?? String(n + 1)}
                  className="font-mono text-5xl font-bold text-[#2ee6ff]"
                  onChange={(nn) => patchCard(n, { n: nn })}
                />
                <Field
                  editing={editing}
                  value={c.title}
                  className="mt-4 text-lg font-semibold"
                  onChange={(title) => patchCard(n, { title })}
                />
                <Field
                  editing={editing}
                  value={c.line}
                  multiline
                  className="mt-1 text-base leading-snug text-[#b7c4ea]"
                  onChange={(line) => patchCard(n, { line })}
                />
              </li>
            ))}
          </ol>
          <Field
            editing={editing}
            value={slide.note ?? ""}
            className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-[#f0d48a]"
            onChange={(note) => onPatch({ note })}
          />
        </div>
      ) : null}

      {slide.kind === "letters" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <Field
            editing={editing}
            value={slide.title}
            className="text-5xl font-bold tracking-tight"
            onChange={(title) => onPatch({ title })}
          />
          <ul className="mt-6 grid min-h-0 flex-1 grid-cols-4 gap-3">
            {cards.map((c, n) => (
              <li key={n} className="flex flex-col rounded-2xl bg-[#141c42] px-5 py-6 ring-1 ring-[#8b6cff]/50">
                <Field
                  editing={editing}
                  value={c.n ?? ""}
                  className="font-mono text-6xl font-black text-[#8b6cff]"
                  onChange={(nn) => patchCard(n, { n: nn })}
                />
                <Field
                  editing={editing}
                  value={c.title}
                  className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#2ee6ff]"
                  onChange={(title) => patchCard(n, { title })}
                />
                <Field
                  editing={editing}
                  value={c.line}
                  multiline
                  className="mt-2 text-base leading-snug"
                  onChange={(line) => patchCard(n, { line })}
                />
              </li>
            ))}
          </ul>
          <Field
            editing={editing}
            value={slide.note ?? ""}
            className="mt-4 text-sm text-[#b7c4ea]"
            onChange={(note) => onPatch({ note })}
          />
        </div>
      ) : null}

      {slide.kind === "now" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <Field
            editing={editing}
            value={slide.title}
            className="text-5xl font-bold tracking-tight text-[#2ee6ff]"
            onChange={(title) => onPatch({ title })}
          />
          <ul className="mt-6 grid min-h-0 flex-1 gap-3">
            {cards.map((c, n) => (
              <li key={n} className="flex items-center gap-6 rounded-2xl bg-[#141c42] px-6 py-4 ring-1 ring-[#f0d48a]/40">
                <Field
                  editing={editing}
                  value={c.n ?? ""}
                  className="w-36 shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0d48a]"
                  onChange={(nn) => patchCard(n, { n: nn })}
                />
                <div className="min-w-0 flex-1">
                  <Field
                    editing={editing}
                    value={c.title}
                    className="text-2xl font-semibold"
                    onChange={(title) => patchCard(n, { title })}
                  />
                  <Field
                    editing={editing}
                    value={c.line}
                    className="text-sm text-[#b7c4ea]"
                    onChange={(line) => patchCard(n, { line })}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {berty ? (
        <div className="pointer-events-none absolute bottom-6 right-8">
          <Berty pose={berty} size="lg" />
        </div>
      ) : null}
      <footer className="px-12 pb-4 pl-12 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b7c4ea]/70">{COPYRIGHT_LINE}</footer>
    </article>
  );
}

export function DeckBoard({
  unlocked = false,
  onNeedPin,
}: {
  unlocked?: boolean;
  onNeedPin?: () => void;
}) {
  const [pack, setPack] = useState(() => loadDeck());
  const [q, setQ] = useState<DeckQuarter>(() => liveDeckQuarter());
  const [i, setI] = useState(0);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const saveTimer = useRef(0);
  const slides = pack.slides;
  const slide = slides[i] ?? slides[0]!;
  const liveEdit = editing && unlocked && !full;

  const persist = useCallback((next: typeof pack, now = false) => {
    setPack(next);
    setDirty(true);
    setSaved(false);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    const write = () => {
      saveDeck(next);
      saveQuarterDeck(q, next);
      setDirty(false);
      setSaved(true);
    };
    if (now) write();
    else saveTimer.current = window.setTimeout(write, 480);
  }, [q]);

  const patchSlide = useCallback(
    (partial: Partial<DeckSlide>) => {
      const cur = slides[i];
      if (!cur) return;
      persist({ ...pack, slides: slides.map((s, n) => (n === i ? { ...s, ...partial } : s)) });
    },
    [i, pack, persist, slides],
  );

  const go = useCallback(
    (d: number) => {
      setI((n) => Math.max(0, Math.min(slides.length - 1, n + d)));
    },
    [slides.length],
  );

  useEffect(() => {
    function typing(e: KeyboardEvent) {
      const el = (e.target as HTMLElement | null) ?? (document.activeElement as HTMLElement | null);
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return Boolean(el.closest?.("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
    }
    function onKey(e: KeyboardEvent) {
      if (typing(e)) return;
      if (liveEdit && (e.key === " " || e.code === "Space")) return;
      if (e.key === "ArrowRight" || e.key === " " || e.code === "Space" || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(slides.length - 1);
      else if (e.key === "f" || e.key === "F") void stage.current?.requestFullscreen?.();
      else if (e.key === "e" || e.key === "E") {
        if (unlocked) setEditing((v) => !v);
        else onNeedPin?.();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        persist(pack, true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, liveEdit, onNeedPin, pack, persist, slides.length, unlocked]);

  useEffect(() => {
    function onFs() {
      setFull(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
  }, []);

  function askEdit() {
    if (!unlocked) {
      onNeedPin?.();
      return;
    }
    setEditing((v) => !v);
  }

  function addCard() {
    const cards = [...(slide.cards ?? []), { title: "New", line: "Type here." }];
    patchSlide({ cards: cards.slice(0, 8) });
  }

  function dropCard() {
    const cards = (slide.cards ?? []).slice(0, -1);
    patchSlide({ cards });
  }

  function dupe() {
    const copy = sanitizeSlide({ ...slide, id: `s${Date.now().toString(36)}` }, "dupe");
    const next = [...slides];
    next.splice(i + 1, 0, copy);
    persist({ ...pack, slides: next }, true);
    setI(i + 1);
  }

  function addSlide() {
    const next = [...slides, blankSlide()];
    persist({ ...pack, slides: next }, true);
    setI(next.length - 1);
    setEditing(true);
  }

  function dropSlide() {
    if (slides.length < 2) return;
    const next = slides.filter((_, n) => n !== i);
    persist({ ...pack, slides: next }, true);
    setI(Math.max(0, i - 1));
  }

  function resetThis() {
    const factory = DECK.find((s) => s.id === slide.id) ?? DECK[Math.min(i, DECK.length - 1)]!;
    patchSlide(cloneDeck([factory])[0]!);
  }

  function resetAll() {
    const next = resetDeck();
    setPack(next);
    setI(0);
    setDirty(false);
    setSaved(true);
    saveQuarterDeck(q, next);
  }

  function switchQ(next: DeckQuarter) {
    if (next === q) return;
    saveDeck(pack);
    saveQuarterDeck(q, pack);
    setLiveDeckQuarter(next);
    const loaded = loadQuarterDeck(next);
    const nextPack = loaded ?? { title: pack.title, slides: cloneDeck(pack.slides) };
    if (!loaded) saveQuarterDeck(next, nextPack);
    setPack(nextPack);
    saveDeck(nextPack);
    setQ(next);
    setI(0);
    setDirty(false);
    setSaved(true);
  }

  const liveQ = quarterNow(todayIso()).n;
  const nextQ = liveQ < 4 ? (`Q${liveQ + 1}` as DeckQuarter) : null;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {liveEdit ? (
          <input
            value={pack.title}
            onChange={(e) => persist({ ...pack, title: e.target.value })}
            onKeyDown={(e) => e.stopPropagation()}
            className="min-h-10 min-w-[12rem] rounded-md bg-elevated px-3 text-sm font-medium uppercase tracking-wider"
          />
        ) : (
          <p className="text-sm font-medium uppercase tracking-wider text-subtle">{pack.title}</p>
        )}
        <span className="font-mono text-xs text-muted">
          {i + 1} / {slides.length}
        </span>
        {dirty ? <span className="font-mono text-[11px] uppercase tracking-wide text-gold">Unsaved</span> : null}
        {saved && !dirty ? <span className="font-mono text-[11px] uppercase tracking-wide text-muted">Saved on this desk</span> : null}
        <div className="ml-auto flex flex-wrap gap-1">
          <button type="button" onClick={() => go(-1)} className="tw-tap inline-flex size-11 items-center justify-center rounded-md bg-elevated" aria-label="Previous slide">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => go(1)} className="tw-tap inline-flex size-11 items-center justify-center rounded-md bg-elevated" aria-label="Next slide">
            <ChevronRight className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => void stage.current?.requestFullscreen?.()}
            className="tw-tap inline-flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 text-sm font-semibold"
          >
            <Maximize2 className="size-4" /> Present
          </button>
          <button
            type="button"
            onClick={askEdit}
            className={cn("tw-tap inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold", liveEdit ? "bg-accent text-accent-fg" : "bg-elevated")}
          >
            <Pencil className="size-4" /> {liveEdit ? "Editing" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => persist(pack, true)}
            className="tw-tap inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg"
          >
            <Save className="size-4" /> Save
          </button>
          <a href={FILE} download className="tw-tap inline-flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 text-sm font-semibold">
            <Download className="size-4" /> PowerPoint
          </a>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Pack</span>
        {DECK_QUARTERS.map((id) => {
          const snap = hasQuarterDeck(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchQ(id)}
              className={cn(
                "tw-tap min-h-9 rounded-md px-2.5 font-mono text-xs font-bold",
                q === id ? "bg-accent text-accent-fg" : snap ? "bg-elevated text-fg" : "bg-elevated text-muted",
              )}
            >
              {id}
            </button>
          );
        })}
        {unlocked && nextQ ? (
          <button
            type="button"
            onClick={() => {
              copyDeckToQuarter(q, nextQ);
              setSaved(true);
            }}
            className="tw-tap min-h-9 rounded-md bg-gold px-3 text-xs font-semibold text-bg"
          >
            Copy pack → {nextQ}
          </button>
        ) : null}
      </div>
      <div
        ref={stage}
        className="relative mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-hidden rounded-xl bg-[#050816] ring-1 ring-white/10"
        style={{ aspectRatio: "16 / 9" }}
        onClick={() => {
          if (!liveEdit) go(1);
        }}
        role="img"
        aria-label={slide.title}
      >
        <Stage slide={slide} editing={liveEdit} onPatch={patchSlide} />
      </div>
      {liveEdit ? (
        <div className="flex flex-wrap items-center gap-1">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => patchSlide({ kind: k })}
              className={cn("tw-tap min-h-9 rounded-full px-3 font-mono text-[11px] font-bold uppercase", slide.kind === k ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {k}
            </button>
          ))}
          <button type="button" onClick={addCard} className="tw-tap inline-flex min-h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-semibold">
            <Plus className="size-3.5" /> Card
          </button>
          <button type="button" onClick={dropCard} className="tw-tap inline-flex min-h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-semibold">
            − Card
          </button>
          <button type="button" onClick={dupe} className="tw-tap inline-flex min-h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-semibold">
            <Copy className="size-3.5" /> Duplicate
          </button>
          <button type="button" onClick={addSlide} className="tw-tap inline-flex min-h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-semibold">
            <Plus className="size-3.5" /> Add slide
          </button>
          <button type="button" onClick={dropSlide} className="tw-tap inline-flex min-h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-semibold">
            <Trash2 className="size-3.5" /> Delete
          </button>
          <button type="button" onClick={resetThis} className="tw-tap inline-flex min-h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-semibold">
            <RotateCcw className="size-3.5" /> This slide
          </button>
          <button type="button" onClick={resetAll} className="tw-tap inline-flex min-h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-semibold">
            Factory deck
          </button>
          <button type="button" onClick={() => downloadDeck(pack)} className="tw-tap inline-flex min-h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-semibold">
            JSON
          </button>
        </div>
      ) : null}
      <ol className="flex flex-wrap gap-1">
        {slides.map((s, n) => (
          <li key={s.id + n}>
            <button
              type="button"
              onClick={() => setI(n)}
              className={cn("min-h-9 rounded-full px-3 font-mono text-[11px] font-bold uppercase tracking-wide", n === i ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
            >
              {n + 1} {s.kicker ?? s.title}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
