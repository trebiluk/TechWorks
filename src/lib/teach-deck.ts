import type { EconomyFile } from "@/lib/economy";
import { todayIso } from "@/lib/calendar";
import type { DeckSlide } from "@/data/deck";
import type { DeckPack } from "@/lib/deck-store";
import { slotsOf, upsertProject } from "@/lib/projects";
import { laySlots, packOf, setTeachNotes, teachDay, teachJob, teachObjective, hangOf } from "@/lib/teach";
import { hangKindLabel, hangSrc } from "@/lib/hang";
import { hourAgendaDraft, saveAgendaLine, type AgendaCard } from "@/lib/hour-flow";
import { saveTeachAsk, saveTeachDo, saveTeachLine, saveTeachObjective } from "@/lib/plan-sync";

const AGENDA_N: Record<string, AgendaCard["id"]> = {
  "01": "now",
  "02": "goal",
  "03": "next",
  "04": "behave",
};

/** Deck plays this period’s Teach plan. One write. */
export function teachDeckOf(file: EconomyFile, period: number, date = todayIso()): DeckPack {
  const job = teachJob(file, period, date);
  const obj = teachObjective(file, date, period);
  const pack = packOf(file, date, period);
  const slots = laySlots(file, date, period);
  const beats = slots.length ? slots : pack.slots;
  const agenda = hourAgendaDraft(file, date, period);
  const slides: DeckSlide[] = [
    {
      id: "job",
      kind: "title",
      kicker: [`P${period}`, job.grade ? `G${job.grade}` : "", job.stage].filter(Boolean).join(" · "),
      title: job.question || job.title || "Today",
      line: obj || job.stemLine,
      note: teachDay(file, date, period).notes,
      berty: "think",
    },
    {
      id: "agenda",
      kind: "cards",
      kicker: "Agenda",
      title: "This hour",
      berty: "point",
      cards: agenda.map((c) => ({ n: c.n, title: `${c.n} ${c.kicker}`, line: c.body })),
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
      line: s.line,
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
  for (const h of hangOf(file, date, period)) {
    slides.push({
      id: `hang-${h.id}`,
      kind: "embed",
      kicker: hangKindLabel(h.kind),
      title: h.title || hangKindLabel(h.kind),
      line: h.url,
      src: hangSrc(h) ?? undefined,
      berty: "think",
    });
  }
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

function patchRules(file: EconomyFile, period: number, date: string, rules: string[]): EconomyFile {
  const parked = slotsOf(file, period, date)[0];
  if (!parked) return file;
  return upsertProject(file, { ...parked, constraints: rules.map((r) => r.trim()).filter(Boolean) });
}

function patchLookFor(file: EconomyFile, period: number, date: string, lookFor: string): EconomyFile {
  const parked = slotsOf(file, period, date)[0];
  if (!parked) return file;
  const acts = parked.activities ?? [];
  if (!acts.length) return file;
  return upsertProject(file, {
    ...parked,
    activities: acts.map((a, i) => (i === 0 ? { ...a, lookFor: lookFor.trim() } : a)),
  });
}

function patchDone(file: EconomyFile, period: number, date: string, done: string): EconomyFile {
  const parked = slotsOf(file, period, date)[0];
  if (!parked) return file;
  return upsertProject(file, { ...parked, activities: (parked.activities ?? []).map((a, i) => (i === 0 ? { ...a, done: done.trim() } : a)) });
}

function agendaIdOf(card: { n?: string; title?: string }): AgendaCard["id"] | null {
  const n = String(card.n ?? "").trim();
  if (AGENDA_N[n]) return AGENDA_N[n];
  const title = String(card.title ?? "");
  const hit = title.match(/^(01|02|03|04)\b/);
  return hit ? AGENDA_N[hit[1]!] ?? null : null;
}

/** Deck field → same Teach / Plan fields. Next paint of either screen matches. */
export function patchTeachFromDeck(
  file: EconomyFile,
  period: number,
  date: string,
  slideId: string,
  patch: Partial<DeckSlide>,
): EconomyFile {
  let next = file;
  if (slideId === "job") {
    if (patch.title != null) next = saveTeachAsk(next, date, period, patch.title);
    if (patch.line != null) next = saveTeachObjective(next, date, period, patch.line);
    if (patch.note != null) next = setTeachNotes(next, date, period, patch.note);
    return next;
  }
  if (slideId === "agenda" && patch.cards) {
    for (const c of patch.cards) {
      const id = agendaIdOf(c);
      if (id && c.line != null) next = saveAgendaLine(next, date, period, id, c.line);
    }
    return next;
  }
  if (slideId === "beats") {
    if (patch.title != null) next = saveTeachObjective(next, date, period, patch.title);
    const slots = laySlots(next, date, period);
    (patch.cards ?? []).forEach((c, i) => {
      const s = slots[i];
      if (!s || c.line == null) return;
      next = saveTeachLine(next, date, period, s.id, c.line);
    });
    return next;
  }
  if (slideId === "prove") {
    for (const c of patch.cards ?? []) {
      if (c.title === "Today" && c.line != null) next = saveTeachDo(next, date, period, c.line);
      if (c.title === "Done" && c.line != null) {
        next = saveTeachObjective(next, date, period, c.line);
        next = patchDone(next, period, date, c.line);
      }
      if (c.title === "Look-for" && c.line != null) next = patchLookFor(next, period, date, c.line);
    }
    return next;
  }
  if (slideId === "clean" && patch.line != null) {
    return saveTeachLine(next, date, period, "clean", patch.line);
  }
  if (slideId === "rules" && patch.cards) {
    if (!slotsOf(next, period, date)[0]) {
      const seed = patch.cards[0]?.title?.trim() || "How we win";
      next = saveTeachAsk(next, date, period, seed);
    }
    return patchRules(next, period, date, patch.cards.map((c) => c.title));
  }
  return next;
}
