"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, Maximize2 } from "lucide-react";
import { Berty } from "@/components/berty";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { DECK, DECK_TITLE, type DeckSlide } from "@/data/deck";
import { cn } from "@/lib/utils";

const FILE = "/TechWorks-Deck.pptx";

function Stage({ slide }: { slide: DeckSlide }) {
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
        {slide.kicker ? (
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0d48a]">{slide.kicker}</p>
        ) : null}
      </header>

      {slide.kind === "title" || slide.kind === "close" ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center px-12 pb-10">
          <h1
            className={cn(
              "font-black uppercase leading-[0.9] tracking-tight text-[#2ee6ff]",
              slide.kind === "title" ? "text-[clamp(3.2rem,9vw,7.2rem)]" : "text-[clamp(2.4rem,6vw,4.6rem)] normal-case tracking-tight",
            )}
            style={slide.kind === "close" ? { color: "#f7f9ff" } : undefined}
          >
            {slide.title}
          </h1>
          {slide.line ? <p className="mt-5 max-w-3xl text-2xl font-medium text-[#b7c4ea]">{slide.line}</p> : null}
          {slide.note ? <p className="mt-4 font-mono text-sm uppercase tracking-[0.16em] text-[#f0d48a]">{slide.note}</p> : null}
        </div>
      ) : null}

      {slide.kind === "cards" || slide.kind === "blank" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <h1 className="text-5xl font-bold tracking-tight">{slide.title}</h1>
          <ul className="mt-6 grid min-h-0 flex-1 grid-cols-2 gap-3">
            {(slide.cards ?? []).map((c) => (
              <li key={c.title} className="flex flex-col justify-center rounded-2xl bg-[#141c42] px-6 py-5 ring-1 ring-white/10">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0d48a]">{c.title}</p>
                <p className="mt-2 text-xl leading-snug text-[#f7f9ff]">{c.line}</p>
              </li>
            ))}
          </ul>
          {slide.note ? <p className="mt-4 text-sm text-[#b7c4ea]">{slide.note}</p> : null}
        </div>
      ) : null}

      {slide.kind === "steps" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <h1 className="text-5xl font-bold tracking-tight">{slide.title}</h1>
          <ol className="mt-6 grid min-h-0 flex-1 grid-cols-4 gap-3">
            {(slide.cards ?? []).map((c) => (
              <li key={c.n} className="flex flex-col rounded-2xl bg-[#141c42] px-5 py-6 ring-1 ring-white/10">
                <p className="font-mono text-4xl font-bold text-[#8b6cff]">{c.n}</p>
                <p className="mt-4 font-mono text-sm font-bold uppercase tracking-[0.16em] text-[#2ee6ff]">{c.title}</p>
                <p className="mt-2 text-lg leading-snug">{c.line}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {slide.kind === "ladder" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <h1 className="text-5xl font-bold tracking-tight">{slide.title}</h1>
          <ol className="mt-6 grid min-h-0 flex-1 grid-cols-4 gap-3">
            {(slide.cards ?? []).map((c) => (
              <li
                key={c.n}
                className={cn(
                  "flex flex-col rounded-2xl px-5 py-6 ring-1",
                  c.n === "3" ? "bg-[#1E4BAF] ring-[#2ee6ff]" : "bg-[#141c42] ring-white/10",
                )}
              >
                <p className="font-mono text-5xl font-bold text-[#2ee6ff]">{c.n}</p>
                <p className="mt-4 text-lg font-semibold">{c.title}</p>
                <p className="mt-1 text-base leading-snug text-[#b7c4ea]">{c.line}</p>
              </li>
            ))}
          </ol>
          {slide.note ? <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-[#f0d48a]">{slide.note}</p> : null}
        </div>
      ) : null}

      {slide.kind === "letters" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <h1 className="text-5xl font-bold tracking-tight">{slide.title}</h1>
          <ul className="mt-6 grid min-h-0 flex-1 grid-cols-4 gap-3">
            {(slide.cards ?? []).map((c) => (
              <li key={c.n} className="flex flex-col rounded-2xl bg-[#141c42] px-5 py-6 ring-1 ring-[#8b6cff]/50">
                <p className="font-mono text-6xl font-black text-[#8b6cff]">{c.n}</p>
                <p className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#2ee6ff]">{c.title}</p>
                <p className="mt-2 text-base leading-snug">{c.line}</p>
              </li>
            ))}
          </ul>
          {slide.note ? <p className="mt-4 text-sm text-[#b7c4ea]">{slide.note}</p> : null}
        </div>
      ) : null}

      {slide.kind === "now" ? (
        <div className="flex min-h-0 flex-1 flex-col px-12 pb-8 pt-4">
          <h1 className="text-5xl font-bold tracking-tight text-[#2ee6ff]">{slide.title}</h1>
          <ul className="mt-6 grid min-h-0 flex-1 gap-3">
            {(slide.cards ?? []).map((c) => (
              <li key={c.n} className="flex items-center gap-6 rounded-2xl bg-[#141c42] px-6 py-4 ring-1 ring-[#f0d48a]/40">
                <p className="w-36 shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0d48a]">{c.n}</p>
                <div>
                  <p className="text-2xl font-semibold">{c.title}</p>
                  <p className="text-sm text-[#b7c4ea]">{c.line}</p>
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

export function DeckBoard() {
  const [i, setI] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const slide = DECK[i] ?? DECK[0]!;
  const go = useCallback((d: number) => {
    setI((n) => Math.max(0, Math.min(DECK.length - 1, n + d)));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(DECK.length - 1);
      else if (e.key === "f" || e.key === "F") void stage.current?.requestFullscreen?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">{DECK_TITLE}</p>
        <span className="font-mono text-xs text-muted">
          {i + 1} / {DECK.length}
        </span>
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
          <a href={FILE} download className="tw-tap inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
            <Download className="size-4" /> PowerPoint
          </a>
          <a href="/TechWorks-Deck.pdf" download className="tw-tap inline-flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 text-sm font-semibold">
            <FileText className="size-4" /> PDF
          </a>
        </div>
      </div>
      <div
        ref={stage}
        className="relative mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-hidden rounded-xl bg-[#050816] ring-1 ring-white/10"
        style={{ aspectRatio: "16 / 9" }}
        onClick={() => go(1)}
        role="img"
        aria-label={slide.title}
      >
        <Stage slide={slide} />
      </div>
      <ol className="flex flex-wrap gap-1">
        {DECK.map((s, n) => (
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
