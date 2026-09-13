import type { EconomyFile } from "@/lib/economy";
import { todayIso } from "@/lib/calendar";
import type { DeckSlide } from "@/data/deck";
import type { DeckPack } from "@/lib/deck-store";
import { jobCardOf } from "@/lib/projects";
import { laySlots, packOf, teachObjective } from "@/lib/teach";

/** Deck plays this period’s Teach plan. Teach is the only author. */
export function teachDeckOf(file: EconomyFile, period: number, date = todayIso()): DeckPack {
  const job = jobCardOf(file, period, date);
  const obj = teachObjective(file, date, period);
  const pack = packOf(file, date, period);
  const slots = laySlots(file, date, period);
  const beats = slots.length ? slots : pack.slots;
  const slides: DeckSlide[] = [
    {
      id: "job",
      kind: "title",
      kicker: [`P${period}`, job.grade ? `G${job.grade}` : "", job.stage].filter(Boolean).join(" · "),
      title: job.question || job.title || "Today",
      line: obj || job.stemLine,
      berty: "think",
    },
  ];
  if (job.rules.length) {
    slides.push({
      id: "rules",
      kind: "cards",
      kicker: "Rules",
      title: "How we win",
      berty: "point",
      cards: job.rules.map((r, n) => ({ n: String(n + 1), title: r, line: "" })),
    });
  }
  slides.push({
    id: "beats",
    kind: "steps",
    kicker: pack.label,
    title: obj || pack.label,
    cards: beats.map((s, n) => ({
      n: String(n + 1),
      title: s.title,
      line: s.kind === "work" ? job.today || s.line : s.line,
    })),
  });
  const prove = [
    job.today ? { title: "Today", line: job.today } : null,
    job.lookFor ? { title: "Look-for", line: job.lookFor } : null,
    job.done ? { title: "Done", line: job.done } : null,
  ].filter((c): c is { title: string; line: string } => Boolean(c));
  if (prove.length) {
    slides.push({
      id: "prove",
      kind: "cards",
      kicker: "Prove it",
      title: job.today || "Today",
      berty: "standing",
      cards: prove,
    });
  }
  const clean = beats.find((s) => s.clean || s.kind === "clean");
  slides.push({
    id: "clean",
    kind: "close",
    kicker: "Before the bell",
    title: "CLEAN UP",
    line: clean?.line || "Tools, scraps, seats.",
    berty: "point",
  });
  return { title: `P${period} · ${job.title || "Today"}`, slides };
}
