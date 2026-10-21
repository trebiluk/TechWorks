import type { EconomyFile } from "./economy.ts";
import { planCell } from "./planbook.ts";
import { planitPreview } from "./planit.ts";

export type AutoSlide = {
  id: string;
  kicker: string;
  title: string;
  line: string;
};

const DEFAULT_NOW = new Set(["Sit with your crew.", "Goggles on. Sit with your crew."]);
const DEFAULT_BEHAVE = "Take care of yourself, your crew, and the shop. Choose → work → focus → cleanup.";

/** Title, the kit, each agenda card, prove, then cleanup. An empty hour is one slide. */
export function slidesFor(file: EconomyFile, date: string, period: number): AutoSlide[] {
  const preview = planitPreview(file, date, period);
  const prove = planCell(file, date, period).objective.trim();
  const cards = preview.cards.filter((card) => cardIsPlan(card.kicker, card.body));
  const need = preview.need.trim();
  const needIsPlan = Boolean(need) && need !== "Goggles";
  const planned = Boolean(preview.title.trim() || preview.question.trim() || prove || needIsPlan || cards.length);
  if (!planned) {
    return [{ id: "empty", kicker: "Deck", title: "No plan yet", line: "Write the hour in PlanIt." }];
  }
  const slides: AutoSlide[] = [
    {
      id: "title",
      kicker: "This hour",
      title: preview.title.trim() || "This hour",
      line: preview.question.trim(),
    },
    { id: "need", kicker: "Need", title: "Need", line: need || "Nothing extra" },
  ];
  preview.cards.forEach((card, index) => {
    slides.push({
      id: `card-${card.n || index + 1}`,
      kicker: card.kicker || "Agenda",
      title: card.kicker || "Agenda",
      line: card.body.trim(),
    });
  });
  slides.push({ id: "prove", kicker: "Prove", title: "Prove", line: prove || "Show the work." });
  slides.push({ id: "clean", kicker: "Cleanup", title: "Cleanup", line: "Tools, scraps, seats." });
  return slides;
}

function cardIsPlan(kicker: string, body: string): boolean {
  const line = body.trim();
  if (!line) return false;
  if (kicker === "Now" && DEFAULT_NOW.has(line)) return false;
  if (kicker === "How we work" && line === DEFAULT_BEHAVE) return false;
  return true;
}
