import { GLOSSARY, searchGlossary, type GlossaryCat, type GlossaryEntry } from "@/data/glossary";

export type VocabKind = "def" | "term" | "use";

export type VocabQ = {
  id: string;
  kind: VocabKind;
  prompt: string;
  answer: string;
  choices: string[];
  term: string;
  say?: string;
  cat: GlossaryCat;
  def: string;
};

export const HEAT_SECS = 12;
export const HEAT_SIZES = [6, 10, 15] as const;

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function distractors(hit: GlossaryEntry, pool: GlossaryEntry[], take: number): GlossaryEntry[] {
  const same = pool.filter((x) => x.id !== hit.id && x.cat === hit.cat);
  const rest = pool.filter((x) => x.id !== hit.id && x.cat !== hit.cat);
  return shuffle([...same, ...rest]).slice(0, take);
}

function promptOf(e: GlossaryEntry, kind: VocabKind): { prompt: string; answer: string; wrong: (o: GlossaryEntry) => string } {
  if (kind === "term") {
    return {
      prompt: e.def,
      answer: e.term,
      wrong: (o) => o.term,
    };
  }
  if (kind === "use") {
    return {
      prompt: `Which shop sentence uses “${e.term}” the right way?`,
      answer: e.use,
      wrong: (o) => o.use,
    };
  }
  return {
    prompt: `What does ${e.term.toUpperCase()} mean?`,
    answer: e.def,
    wrong: (o) => o.def,
  };
}

export function dealHeat(n = 10, cat: GlossaryCat | "All" = "All"): VocabQ[] {
  const pool = searchGlossary("", cat);
  const bank = pool.length >= 4 ? pool : GLOSSARY;
  const count = Math.min(Math.max(1, n), bank.length);
  return shuffle(bank)
    .slice(0, count)
    .map((e, i) => {
      const kind: VocabKind = (["def", "term", "use"] as const)[i % 3];
      const { prompt, answer, wrong } = promptOf(e, kind);
      const others = distractors(e, bank, 3);
      const choices = shuffle([answer, ...others.map(wrong)]);
      return {
        id: `${e.id}-${kind}-${i}`,
        kind,
        prompt,
        answer,
        choices,
        term: e.term,
        say: e.say,
        cat: e.cat,
        def: e.def,
      };
    });
}

export function heatScore(correct: boolean, secsLeft: number, streak: number): number {
  if (!correct) return 0;
  return 100 + Math.max(0, Math.round(secsLeft * 8)) + streak * 25;
}
