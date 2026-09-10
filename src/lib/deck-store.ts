import { DECK, DECK_TITLE, type DeckCard, type DeckKind, type DeckSlide } from "@/data/deck";
import { quarterNow, todayIso } from "@/lib/calendar";

const KEY = "techworks-deck-v1";
const QKEY = "techworks-deck-q";
const KINDS: DeckKind[] = ["title", "cards", "steps", "ladder", "letters", "now", "blank", "close"];
const POSES = ["waving", "standing", "point", "think"] as const;

export type DeckPack = { title: string; slides: DeckSlide[] };
export const DECK_QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
export type DeckQuarter = (typeof DECK_QUARTERS)[number];

function clip(v: unknown, n: number): string {
  return String(v ?? "")
    .replace(/\0/g, "")
    .slice(0, n)
    .trim();
}

function cardOf(raw: unknown, i: number): DeckCard {
  const c = raw && typeof raw === "object" ? (raw as DeckCard) : ({} as DeckCard);
  return {
    n: clip(c.n, 16) || String(i + 1),
    title: clip(c.title, 80) || "Title",
    line: clip(c.line, 220) || "",
  };
}

export function sanitizeSlide(raw: unknown, fallbackId: string): DeckSlide {
  const s = raw && typeof raw === "object" ? (raw as DeckSlide) : ({} as DeckSlide);
  const kind = KINDS.includes(s.kind) ? s.kind : "cards";
  const pose = POSES.includes(s.berty as (typeof POSES)[number]) ? s.berty : undefined;
  const cards = Array.isArray(s.cards) ? s.cards.slice(0, 8).map(cardOf) : undefined;
  const id = clip(s.id, 40).replace(/[^a-z0-9-]/gi, "") || fallbackId;
  return {
    id,
    kind,
    title: clip(s.title, 80) || "Slide",
    kicker: clip(s.kicker, 80) || undefined,
    line: clip(s.line, 220) || undefined,
    note: clip(s.note, 220) || undefined,
    berty: pose,
    cards,
  };
}

export function cloneDeck(slides: DeckSlide[] = DECK): DeckSlide[] {
  return slides.map((s, i) => sanitizeSlide(s, `s${i + 1}`));
}

export function blankSlide(kind: DeckKind = "blank"): DeckSlide {
  return sanitizeSlide(
    {
      id: `s${Date.now().toString(36)}`,
      kind,
      kicker: "Section",
      title: "Title here",
      cards: [
        { title: "Left", line: "Type over this." },
        { title: "Right", line: "Keep the navy plate." },
      ],
    },
    "blank",
  );
}

export function loadDeck(): DeckPack {
  if (typeof window === "undefined") return { title: DECK_TITLE, slides: cloneDeck() };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { title: DECK_TITLE, slides: cloneDeck() };
    const p = JSON.parse(raw) as Partial<DeckPack>;
    const slides = Array.isArray(p.slides) ? p.slides.map((s, i) => sanitizeSlide(s, `s${i + 1}`)) : [];
    if (!slides.length) return { title: DECK_TITLE, slides: cloneDeck() };
    return { title: clip(p.title, 80) || DECK_TITLE, slides };
  } catch {
    return { title: DECK_TITLE, slides: cloneDeck() };
  }
}

export function saveDeck(pack: DeckPack) {
  if (typeof window === "undefined") return;
  const next: DeckPack = {
    title: clip(pack.title, 80) || DECK_TITLE,
    slides: cloneDeck(pack.slides),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function quarterDeckKey(q: string): string {
  return `${KEY}-${q.replace(/[^A-Z0-9]/gi, "").slice(0, 4) || "Q"}`;
}

export function loadQuarterDeck(q: string): DeckPack | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(quarterDeckKey(q));
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<DeckPack>;
    const slides = Array.isArray(p.slides) ? p.slides.map((s, i) => sanitizeSlide(s, `s${i + 1}`)) : [];
    if (!slides.length) return null;
    return { title: clip(p.title, 80) || DECK_TITLE, slides };
  } catch {
    return null;
  }
}

export function saveQuarterDeck(q: string, pack: DeckPack) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(quarterDeckKey(q), JSON.stringify({ title: clip(pack.title, 80) || DECK_TITLE, slides: cloneDeck(pack.slides) }));
  } catch {
    /* */
  }
}

export function hasQuarterDeck(q: string): boolean {
  return loadQuarterDeck(q) != null;
}

export function liveDeckQuarter(): DeckQuarter {
  try {
    const v = window.localStorage.getItem(QKEY);
    if (v === "Q1" || v === "Q2" || v === "Q3" || v === "Q4") return v;
  } catch {
    /* */
  }
  try {
    return quarterNow(todayIso()).label;
  } catch {
    return "Q1";
  }
}

export function setLiveDeckQuarter(q: DeckQuarter) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QKEY, q);
  } catch {
    /* */
  }
}

/** Snapshot `from` (or the live deck) onto `to` so Q2 can be edited without losing Q1. */
export function copyDeckToQuarter(from: string, to: string) {
  if (typeof window === "undefined") return;
  const pack = loadQuarterDeck(from) ?? loadDeck();
  saveQuarterDeck(from, pack);
  saveQuarterDeck(to, { title: pack.title, slides: cloneDeck(pack.slides) });
}

export function useQuarterDeck(q: string): DeckPack {
  return loadQuarterDeck(q) ?? loadDeck();
}

export function resetDeck(): DeckPack {
  const next = { title: DECK_TITLE, slides: cloneDeck() };
  saveDeck(next);
  return next;
}

export function downloadDeck(pack: DeckPack) {
  if (typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify({ title: pack.title, slides: pack.slides }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "techworks-deck.json";
  a.click();
  URL.revokeObjectURL(url);
}
