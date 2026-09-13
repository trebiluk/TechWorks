"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Pencil } from "lucide-react";
import { Berty } from "@/components/berty";
import { COPYRIGHT_LINE } from "@/lib/copy";
import type { DeckCard, DeckSlide } from "@/data/deck";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { formatSchoolDate, todayIso } from "@/lib/calendar";
import { useShopClock } from "@/lib/use-clock";
import { deskBellId } from "@/lib/store";
import { teachDeckOf } from "@/lib/teach-deck";
import { teachFocusPeriod } from "@/lib/teach";
import { cn } from "@/lib/utils";
import { isTypingTarget } from "@/lib/keys";

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
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-10 pb-1 pt-5 pl-12">
        <img src="/brand/techworks.png" alt="TechWorks" className="h-7 w-auto shrink-0" draggable={false} />
        <Field
          editing={editing}
          value={slide.kicker ?? ""}
          placeholder="Kicker"
          className="max-w-sm text-right font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0d48a]"
          onChange={(kicker) => onPatch({ kicker })}
        />
      </header>

      {slide.kind === "title" || slide.kind === "close" ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-12 py-3 pr-36 pb-6">
          <Field
            editing={editing}
            value={slide.title}
            placeholder="Title"
            className={cn(
              "block font-black uppercase tracking-tight text-[#2ee6ff] text-balance break-words",
              slide.kind === "title"
                ? "text-[clamp(1.6rem,4.6vw,3.6rem)] leading-[1.08]"
                : "text-[clamp(1.6rem,4vw,3rem)] leading-[1.1] normal-case tracking-tight",
            )}
            style={slide.kind === "close" ? { color: "#f7f9ff" } : undefined}
            onChange={(title) => onPatch({ title })}
          />
          <Field
            editing={editing}
            value={slide.line ?? ""}
            placeholder="Line"
            multiline
            className="mt-4 max-w-3xl text-xl font-medium leading-snug text-[#b7c4ea]"
            onChange={(line) => onPatch({ line })}
          />
          <Field
            editing={editing}
            value={slide.note ?? ""}
            placeholder="Note"
            className="mt-3 font-mono text-sm uppercase tracking-[0.16em] text-[#f0d48a]"
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
        <div className="pointer-events-none absolute bottom-10 right-8">
          <Berty pose={berty} size="md" />
        </div>
      ) : null}
      <footer className="relative z-10 shrink-0 px-12 pb-3 pl-12 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b7c4ea]/70">{COPYRIGHT_LINE}</footer>
    </article>
  );
}

export function DeckBoard({
  file,
  unlocked = false,
  date: dateProp,
  onNeedPin,
  onTeach,
}: {
  file: EconomyFile;
  unlocked?: boolean;
  date?: string;
  onNeedPin?: () => void;
  onTeach?: () => void;
}) {
  const today = todayIso();
  const date = dateProp || today;
  const bellsId = deskBellId(file, today);
  const now = useShopClock(bellsId, "beat");
  const shop = shopBells(file).map((b) => b.period);
  const [pick, setPick] = useState<number | null>(null);
  const period = date === today ? teachFocusPeriod(file, today, now, pick) : (pick && shop.includes(pick) ? pick : shop[0] ?? 1);
  const pack = useMemo(() => teachDeckOf(file, period, date), [file, period, date]);
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const slides = pack.slides;
  const slide = slides[Math.min(i, slides.length - 1)] ?? slides[0]!;

  useEffect(() => {
    setI(0);
  }, [period, pack.title]);

  const go = useCallback(
    (d: number) => {
      setI((n) => Math.max(0, Math.min(slides.length - 1, n + d)));
    },
    [slides.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e)) return;
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
        if (unlocked) onTeach?.();
        else onNeedPin?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onNeedPin, onTeach, slides.length, unlocked]);

  useEffect(() => {
    function onFs() {
      setFull(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function askTeach() {
    if (!unlocked) {
      onNeedPin?.();
      return;
    }
    onTeach?.();
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">{pack.title}</p>
        <span className="text-sm font-semibold text-gold">{formatSchoolDate(date)} · from Teach</span>
        <span className="font-mono text-xs text-muted">
          {Math.min(i + 1, slides.length)} / {slides.length}
        </span>
        <div className="flex flex-wrap gap-1">
          {shop.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPick(p)}
              className={cn(
                "tw-tap min-h-9 rounded-md px-2.5 font-mono text-xs font-bold",
                p === period ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
              )}
            >
              P{p}
            </button>
          ))}
        </div>
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
          {onTeach ? (
            <button
              type="button"
              onClick={askTeach}
              className="tw-tap inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-3 text-sm font-semibold text-bg"
            >
              <Pencil className="size-4" /> Edit on Teach
            </button>
          ) : null}
        </div>
      </div>
      <div
        ref={stage}
        className="relative mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-hidden rounded-xl bg-bg ring-1 ring-border"
        style={{ aspectRatio: "16 / 9" }}
        onClick={() => go(1)}
        role="img"
        aria-label={slide.title}
      >
        <Stage slide={slide} editing={false} onPatch={() => {}} />
        {full ? <span className="sr-only">Presenting</span> : null}
      </div>
      <ol className="flex flex-wrap gap-1">
        {slides.map((s, n) => (
          <li key={s.id}>
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
