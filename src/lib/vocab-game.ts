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

export type MatchTile = {
  key: string;
  pair: string;
  face: "term" | "def";
  text: string;
};

export const HEAT_SECS = 12;
export const HEAT_SIZES = [6, 10, 15] as const;
export const MATCH_SIZES = [4, 6, 8] as const;
export const FLASH_SIZES = [8, 12, 20] as const;

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolOf(cat: GlossaryCat | "All"): GlossaryEntry[] {
  const pool = searchGlossary("", cat);
  return pool.length >= 4 ? pool : GLOSSARY;
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

function toQuestion(e: GlossaryEntry, i: number, bank: GlossaryEntry[], tag: string): VocabQ {
  const kind: VocabKind = (["def", "term", "use"] as const)[i % 3];
  const { prompt, answer, wrong } = promptOf(e, kind);
  const others = distractors(e, bank, 3);
  const choices = shuffle([answer, ...others.map(wrong)]);
  return {
    id: `${e.id}-${kind}-${tag}-${i}`,
    kind,
    prompt,
    answer,
    choices,
    term: e.term,
    say: e.say,
    cat: e.cat,
    def: e.def,
  };
}

export function dealHeat(n = 10, cat: GlossaryCat | "All" = "All"): VocabQ[] {
  const bank = poolOf(cat);
  const count = Math.min(Math.max(1, n), bank.length);
  return shuffle(bank)
    .slice(0, count)
    .map((e, i) => toQuestion(e, i, bank, "heat"));
}

export function dealHeatFrom(ids: string[], cat: GlossaryCat | "All" = "All"): VocabQ[] {
  const wanted = ids.map((id) => GLOSSARY.find((e) => e.id === id)).filter((e): e is GlossaryEntry => Boolean(e));
  if (!wanted.length) return dealHeat(10, cat);
  const bank = poolOf(cat);
  return wanted.map((e, i) => toQuestion(e, i, bank, "seed"));
}

export function dealMatch(n = 6, cat: GlossaryCat | "All" = "All"): MatchTile[] {
  const bank = poolOf(cat);
  const count = Math.min(Math.max(2, n), bank.length);
  const hits = shuffle(bank).slice(0, count);
  const tiles: MatchTile[] = [];
  for (const e of hits) {
    tiles.push({ key: `${e.id}-t`, pair: e.id, face: "term", text: e.term });
    tiles.push({ key: `${e.id}-d`, pair: e.id, face: "def", text: e.def });
  }
  return shuffle(tiles);
}

export function dealFlash(n = 12, cat: GlossaryCat | "All" = "All"): GlossaryEntry[] {
  const bank = poolOf(cat);
  const count = Math.min(Math.max(1, n), bank.length);
  return shuffle(bank).slice(0, count);
}

export function heatScore(correct: boolean, secsLeft: number, streak: number): number {
  if (!correct) return 0;
  return 100 + Math.max(0, Math.round(secsLeft * 8)) + streak * 25;
}

/** Shop spelling: case and hyphens do not matter. The say-alike (curf) does not pass for kerf. */
export function spellNorm(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function spellOk(typed: string, term: string): boolean {
  const a = spellNorm(typed);
  return a.length > 0 && a === spellNorm(term);
}
